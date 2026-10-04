import { describe, expect, it } from 'vitest';
import { arrange, commit, createDocument, deleteInstruction, insertInstruction, moveInstruction, nodeIds, positionOf, redo, undo, updateInstruction, type History, type Instruction } from './index';

const output = (text: string): Instruction => ({ id: crypto.randomUUID(), kind: 'output', mode: 'text', text });
describe('structured document', () => {
  it('starts with two distinct terminals', () => {
    const doc = createDocument();
    expect(nodeIds(doc)).toHaveLength(2);
    expect(doc.program.startId).not.toBe(doc.program.endId);
  });
  it('inserts into the chosen connection, retaining stable IDs', () => {
    let doc = createDocument();
    const a = output('A'), b = output('B'), c = output('C');
    doc = insertInstruction(doc, doc.program.startId, a);
    doc = insertInstruction(doc, a.id, c);
    doc = insertInstruction(doc, a.id, b);
    expect(doc.program.instructions).toEqual([a, b, c]);
  });
  it('rejects duplicate IDs, terminal end and stale insertion points', () => {
    const doc = createDocument();
    expect(() => insertInstruction(doc, doc.program.endId, output('A'))).toThrow('INVALID_INSERT_POINT');
    expect(() => insertInstruction(doc, 'unknown', output('A'))).toThrow('INVALID_INSERT_POINT');
    expect(() => insertInstruction(doc, doc.program.startId, { ...output('A'), id: doc.program.endId })).toThrow('DUPLICATE_ID');
  });
  it('deletes a middle instruction without orphaning its successor', () => {
    let doc = createDocument();
    const a = output('A'), b = output('B');
    doc = insertInstruction(doc, doc.program.startId, a);
    doc = insertInstruction(doc, a.id, b);
    const next = deleteInstruction(doc, a.id);
    expect(next.program.instructions).toEqual([b]);
    expect(next.layout.positions[a.id]).toBeUndefined();
    expect(deleteInstruction(next, next.program.startId)).toBe(next);
  });
  it('editing cannot silently change instruction kind', () => {
    const doc = createDocument(), a = output('A');
    const next = insertInstruction(doc, doc.program.startId, a);
    expect(updateInstruction(next, { ...a, kind: 'output', mode: 'text', text: 'B' }).program.instructions[0]).toMatchObject({ text: 'B' });
    expect(() => updateInstruction(next, { id: a.id, kind: 'input', target: 'x', prompt: '' })).toThrow();
  });
  it('manual movement and auto arrange never change program semantics', () => {
    let doc = createDocument();
    const a = output('A');
    doc = insertInstruction(doc, doc.program.startId, a);
    const moved = moveInstruction(doc, a.id, { x: 800, y: -400 });
    expect(moved.program).toBe(doc.program);
    expect(arrange(moved).program).toBe(doc.program);
    expect(positionOf(arrange(moved), a.id)).toEqual({ x: 0, y: 156 });
  });
  it('insertion preserves existing horizontal placement and opens space below', () => {
    let doc = createDocument();
    doc = moveInstruction(doc, doc.program.endId, { x: 340, y: 500 });
    const next = insertInstruction(doc, doc.program.startId, output('A'));
    expect(positionOf(next, doc.program.endId)).toEqual({ x: 340, y: 656 });
    expect(doc.program.instructions).toHaveLength(0);
  });
  it('rejects non-finite movement and clamps accepted positions', () => {
    const doc = createDocument();
    expect(moveInstruction(doc, doc.program.startId, { x: NaN, y: 0 })).toBe(doc);
    expect(positionOf(moveInstruction(doc, doc.program.startId, { x: 1e9, y: -1e9 }), doc.program.startId)).toEqual({ x: 100000, y: -100000 });
  });
  it('limits instruction count', () => {
    const doc = createDocument();
    doc.program.instructions = Array.from({ length: 300 }, () => output('A'));
    expect(() => insertInstruction(doc, doc.program.startId, output('B'))).toThrow('INSTRUCTION_LIMIT');
  });
});
describe('document history', () => {
  it('undoes and redoes program and layout edits atomically', () => {
    const doc = createDocument();
    let history: History = { present: doc, past: [], future: [] };
    const next = insertInstruction(doc, doc.program.startId, output('A'));
    history = commit(history, next);
    expect(undo(history).present).toBe(doc);
    expect(redo(undo(history)).present).toBe(next);
    const moved = moveInstruction(next, next.program.startId, { x: 150, y: 40 });
    expect(undo(commit(history, moved)).present).toBe(next);
  });
  it('clears redo after a new edit and bounds history', () => {
    const doc = createDocument();
    let h: History = { present: doc, past: [], future: [] };
    for (let i = 0; i < 80; i++) h = commit(h, { ...doc, metadata: { ...doc.metadata, title: `Title ${i}` } });
    expect(h.past).toHaveLength(60);
    expect(commit(undo(h), doc).future).toEqual([]);
    expect(commit(h, h.present)).toBe(h);
  });
});
