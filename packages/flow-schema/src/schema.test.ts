import { describe, expect, it } from 'vitest';
import { createDocument, insertInstruction, type Instruction } from '@flowlab/domain';
import { instructionSchema, parseDocument, projectSchema } from './index';

describe('project boundary', () => {
  it('keeps serialized documents stable on reload so another tab does not rewrite an unchanged draft', () => {
    const doc = createDocument();
    const serialized = JSON.stringify(doc);
    expect(JSON.stringify(parseDocument(serialized))).toBe(serialized);
  });
  it('migrates v1 literal outputs without interpreting their content', () => {
    const doc = createDocument();
    const legacy = { ...doc, schemaVersion: 1, program: { ...doc.program, instructions: [{ id: crypto.randomUUID(), kind: 'output', text: '1 + unknown' }] } };
    const result = parseDocument(JSON.stringify(legacy));
    expect(result.schemaVersion).toBe(4);
    expect(result.program.instructions[0]).toMatchObject({ kind: 'output', mode: 'text', text: '1 + unknown' });
    expect(parseDocument(JSON.stringify(result))).toEqual(result);
  });
  it('rejects v1 with a mode field instead of guessing expression intent', () => {
    const doc = createDocument();
    const legacy = { ...doc, schemaVersion: 1, program: { ...doc.program, instructions: [{ id: crypto.randomUUID(), kind: 'output', mode: 'expression', text: '1' }] } };
    expect(() => parseDocument(JSON.stringify(legacy))).toThrow();
  });
  it('round-trips a document with every supported instruction kind', () => {
    let doc = createDocument();
    const all: Instruction[] = [
      { id: crypto.randomUUID(), kind: 'declaration', name: 'nilai', dataType: 'Integer', initialValue: '0' },
      { id: crypto.randomUUID(), kind: 'input', target: 'nilai', prompt: 'Masukkan nilai' },
      { id: crypto.randomUUID(), kind: 'assignment', target: 'nilai', expression: 'nilai + 1' },
      { id: crypto.randomUUID(), kind: 'output', mode: 'text', text: 'Selesai' },
      { id: crypto.randomUUID(), kind: 'decision', condition: 'nilai > 0', consequent: [{ id: crypto.randomUUID(), kind: 'output', mode: 'text', text: 'Positif' }], alternate: [] },
    ];
    let after = doc.program.startId;
    for (const instruction of all) { doc = insertInstruction(doc, after, instruction); after = instruction.id; }
    expect(parseDocument(JSON.stringify(doc))).toEqual(doc);
  });
  it('rejects unknown versions and unknown fields', () => {
    expect(projectSchema.safeParse({ ...createDocument(), schemaVersion: 5 }).success).toBe(false);
    expect(projectSchema.safeParse({ ...createDocument(), customCode: 'unused' }).success).toBe(false);
  });
  it('rejects duplicate node IDs and orphan positions', () => {
    const doc = createDocument();
    expect(projectSchema.safeParse({ ...doc, program: { ...doc.program, endId: doc.program.startId } }).success).toBe(false);
    expect(projectSchema.safeParse({ ...doc, layout: { positions: { [crypto.randomUUID()]: { x: 1, y: 2 } } } }).success).toBe(false);
  });
  it('rejects malformed names and payload shapes', () => {
    const doc = createDocument();
    doc.program.instructions = [{ id: crypto.randomUUID(), kind: 'input', target: '1invalid', prompt: '' }];
    expect(projectSchema.safeParse(doc).success).toBe(false);
    expect(() => parseDocument('{bad json')).toThrow();
  });
  it('enforces file, string, coordinate, and instruction limits', () => {
    expect(() => parseDocument(' '.repeat(1_000_001))).toThrow('FILE_TOO_LARGE');
    const doc = createDocument();
    doc.program.instructions = [{ id: crypto.randomUUID(), kind: 'output', mode: 'text', text: 'x'.repeat(2001) }];
    expect(projectSchema.safeParse(doc).success).toBe(false);
    doc.program.instructions = [];
    doc.layout.positions[doc.program.startId] = { x: Infinity, y: 0 };
    expect(projectSchema.safeParse(doc).success).toBe(false);
    doc.layout.positions = {};
    doc.program.instructions = Array.from({ length: 301 }, () => ({ id: crypto.randomUUID(), kind: 'output', mode: 'text', text: 'A' }));
    expect(projectSchema.safeParse(doc).success).toBe(false);
  });
});

describe('v3 branch boundary and legacy migration', () => {
  const output = (): Instruction => ({ id: crypto.randomUUID(), kind: 'output', mode: 'expression', text: '1 + 2' });
  const decision = (consequent: Instruction[] = [], alternate: Instruction[] = []): Extract<Instruction, { kind: 'decision' }> => ({ id: crypto.randomUUID(), kind: 'decision', condition: 'true', consequent, alternate });
  it('migrates v2 without altering output mode, IDs, ordering or manual positions', () => {
    const initial = createDocument(), step = output();
    const doc = insertInstruction(initial, initial.program.startId, step);
    doc.layout.positions[step.id] = { x: 432, y: -45 };
    expect(parseDocument(JSON.stringify({ ...doc, schemaVersion: 2 }))).toEqual(doc);
  });
  it('does not accept decision instructions disguised as legacy documents', () => {
    const doc = createDocument();
    doc.program.instructions = [decision()];
    for (const schemaVersion of [1, 2]) expect(() => parseDocument(JSON.stringify({ ...doc, schemaVersion }))).toThrow();
  });
  it('rejects missing branches, empty conditions and duplicate IDs across branches or terminals', () => {
    expect(instructionSchema.safeParse({ ...decision(), alternate: undefined }).success).toBe(false);
    expect(instructionSchema.safeParse({ ...decision(), condition: '' }).success).toBe(false);
    const doc = createDocument(), step = output();
    doc.program.instructions = [decision([step], [step])];
    expect(projectSchema.safeParse(doc).success).toBe(false);
    doc.program.instructions = [decision([{ ...step, id: doc.program.endId }])];
    expect(projectSchema.safeParse(doc).success).toBe(false);
  });
  it('enforces recursive instruction count and rejects a thirteenth decision level', () => {
    const doc = createDocument();
    doc.program.instructions = [decision(Array.from({ length: 150 }, output), Array.from({ length: 150 }, output))];
    expect(projectSchema.safeParse(doc).success).toBe(false);
    let nested = decision([output()]);
    for (let i = 1; i < 12; i++) nested = decision([nested]);
    doc.program.instructions = [nested];
    expect(projectSchema.safeParse(doc).success).toBe(true);
    doc.program.instructions = [decision([nested])];
    expect(projectSchema.safeParse(doc).success).toBe(false);
  });
  it('rejects cyclic objects before recursive validation', () => {
    const cyclic = decision();
    cyclic.consequent.push(cyclic);
    expect(instructionSchema.safeParse(cyclic).success).toBe(false);
  });
});

describe('v4 loop boundary', () => {
  const loop = (body: Instruction[] = []): Extract<Instruction, { kind: 'while' }> => ({ id: crypto.randomUUID(), kind: 'while', condition: 'true', body });
  it('migrates v3 nested decisions with IDs, content, and positions unchanged', () => {
    const initial = createDocument();
    const branch: Instruction = { id: crypto.randomUUID(), kind: 'decision', condition: 'true', consequent: [{ id: crypto.randomUUID(), kind: 'output', mode: 'expression', text: '1 + 2' }], alternate: [] };
    const doc = insertInstruction(initial, initial.program.startId, branch);
    expect(parseDocument(JSON.stringify({ ...doc, schemaVersion: 3 }))).toEqual(doc);
  });
  it('roundtrips mixed for/while bodies and keeps serialized property order stable', () => {
    const initial = createDocument();
    const step: Instruction = { id: crypto.randomUUID(), kind: 'for', counter: 'i', from: '1', to: '10', step: '1', body: [loop()] };
    const doc = insertInstruction(initial, initial.program.startId, step);
    expect(parseDocument(JSON.stringify(doc))).toEqual(doc);
    expect(JSON.stringify(parseDocument(JSON.stringify(doc)))).toBe(JSON.stringify(doc));
  });
  it('rejects loops disguised as any legacy version', () => {
    const doc = createDocument(); doc.program.instructions = [loop()];
    for (const schemaVersion of [1, 2, 3]) expect(() => parseDocument(JSON.stringify({ ...doc, schemaVersion }))).toThrow();
  });
  it('requires a body and all for fields, with no unknown fields or invalid counter names', () => {
    const valid = { id: crypto.randomUUID(), kind: 'for', counter: 'i', from: '1', to: '10', step: '1', body: [] };
    for (const field of ['body', 'counter', 'from', 'to', 'step']) expect(instructionSchema.safeParse({ ...valid, [field]: undefined }).success).toBe(false);
    expect(instructionSchema.safeParse({ ...valid, counter: '2bad' }).success).toBe(false);
    expect(instructionSchema.safeParse({ ...valid, extra: true }).success).toBe(false);
  });
  it('rejects cyclic, overdeep, oversized and duplicate loop bodies', () => {
    const cyclic = loop(); cyclic.body.push(cyclic);
    expect(instructionSchema.safeParse(cyclic).success).toBe(false);
    let nested = loop();
    for (let i = 1; i < 13; i++) nested = loop([nested]);
    expect(instructionSchema.safeParse(nested).success).toBe(false);
    expect(instructionSchema.safeParse(loop(Array.from({ length: 300 }, () => ({ id: crypto.randomUUID(), kind: 'output', mode: 'text', text: 'A' })))).success).toBe(false);
    const repeated = loop(), doc = createDocument();
    doc.program.instructions = [loop([repeated, repeated])];
    expect(projectSchema.safeParse(doc).success).toBe(false);
  });
});
