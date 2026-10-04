import { describe, expect, it } from 'vitest';
import { arrange, automaticPositions, commit, createDocument, deleteInstruction, findInstruction, flattenInstructions, insertInstruction, mergeId, moveInstruction, nodeIds, positionOf, projectFlow, redo, undo, updateInstruction, type Instruction } from './index';
const output = (text = 'A'): Instruction => ({ id: crypto.randomUUID(), kind: 'output', mode: 'text', text });
const loop = (body: Instruction[] = []): Extract<Instruction, { kind: 'while' }> => ({ id: crypto.randomUUID(), kind: 'while', condition: 'true', body });

describe('structured loop editing', () => {
  it('inserts at body entry, body tail, and parent continuation separately', () => {
    const initial = createDocument(), header = loop(), a = output('A'), b = output('B'), after = output('After');
    let doc = insertInstruction(initial, initial.program.startId, header);
    doc = insertInstruction(doc, header.id, a, 'body');
    doc = insertInstruction(doc, a.id, b);
    doc = insertInstruction(doc, header.id, after);
    expect(doc.program.instructions).toEqual([{ ...header, body: [a, b] }, after]);
    const { edges } = projectFlow(doc);
    expect(edges).toContainEqual(expect.objectContaining({ source: header.id, target: a.id, branch: 'body', insertion: { afterId: header.id, branch: 'body' } }));
    expect(edges).toContainEqual(expect.objectContaining({ source: b.id, target: header.id, loopBack: true, insertion: { afterId: b.id } }));
    expect(edges).toContainEqual(expect.objectContaining({ source: mergeId(header.id), target: after.id, insertion: { afterId: header.id } }));
  });
  it('projects distinct entry, self-return, exit and continuation for an empty loop', () => {
    const initial = createDocument(), header = loop();
    const doc = insertInstruction(initial, initial.program.startId, header), { edges } = projectFlow(doc);
    expect(edges).toHaveLength(4);
    expect(new Set(edges.map(edge => edge.id)).size).toBe(4);
    expect(edges.find(edge => edge.loopBack)).toMatchObject({ source: header.id, target: header.id, branch: 'body', insertion: { afterId: header.id, branch: 'body' } });
    expect(edges.find(edge => edge.branch === 'exit')).toMatchObject({ source: header.id, target: mergeId(header.id) });
  });
  it('retains nested body and manual offsets after header editing and structural changes', () => {
    const initial = createDocument(), a = output(), inner = loop([a]), outer = loop([inner]);
    let doc = insertInstruction(initial, initial.program.startId, outer);
    const original = positionOf(doc, a.id);
    doc = moveInstruction(doc, a.id, { x: original.x + 100, y: original.y - 20 });
    const added = output();
    const changed = insertInstruction(doc, inner.id, added, 'body');
    const auto = automaticPositions(changed)[a.id]!;
    expect(positionOf(changed, a.id)).toEqual({ x: auto.x + 100, y: auto.y - 20 });
    expect(deleteInstruction(changed, added.id)).toEqual(doc);
    expect(findInstruction(updateInstruction(doc, { ...inner, condition: 'false', body: [] }), inner.id)).toEqual({ ...inner, condition: 'false' });
    expect(arrange(doc).program).toBe(doc.program);
  });
  it('removes mixed loop/decision subtrees and restores them with undo', () => {
    const initial = createDocument(), a = output(), inner = loop([a]);
    const decision: Instruction = { id: crypto.randomUUID(), kind: 'decision', condition: 'true', consequent: [inner], alternate: [] };
    const outer = loop([decision]), doc = insertInstruction(initial, initial.program.startId, outer);
    const next = deleteInstruction(doc, decision.id);
    expect(flattenInstructions(next.program.instructions)).toEqual([{ ...outer, body: [] }]);
    expect(Object.keys(next.layout.positions).sort()).toEqual(nodeIds(next).sort());
    expect(projectFlow(next).positions).not.toHaveProperty(mergeId(inner.id));
    const history = commit({ present: doc, past: [], future: [] }, next);
    expect(undo(history).present).toEqual(doc);
    expect(redo(undo(history)).present).toEqual(next);
  });
  it('routes outer return and exit lanes outside nested loop lanes and manual positions', () => {
    const initial = createDocument(), a = output(), inner = loop([a]), outer = loop([inner]);
    let doc = insertInstruction(initial, initial.program.startId, outer);
    doc = moveInstruction(doc, a.id, { x: -1000, y: 800 });
    const edges = projectFlow(doc).edges;
    const innerBack = edges.find(edge => edge.loopBack && edge.target === inner.id)!;
    const outerBack = edges.find(edge => edge.loopBack && edge.target === outer.id)!;
    expect(innerBack.laneX).toBeLessThan(-1000);
    expect(outerBack.laneX).toBeLessThan(innerBack.laneX!);
    expect(edges.find(edge => edge.branch === 'exit' && edge.source === outer.id)!.laneX).toBeGreaterThan(edges.find(edge => edge.branch === 'exit' && edge.source === inner.id)!.laneX!);
  });
  it('rejects mismatched body/branch anchors and IDs duplicated within loop bodies', () => {
    const initial = createDocument(), a = output(), header = loop([a]);
    const doc = insertInstruction(initial, initial.program.startId, header);
    expect(() => insertInstruction(doc, header.id, output(), 'consequent')).toThrow('INVALID_INSERT_POINT');
    expect(() => insertInstruction(doc, a.id, output(), 'body')).toThrow('INVALID_INSERT_POINT');
    expect(() => insertInstruction(doc, header.id, loop([a]), 'body')).toThrow('DUPLICATE_ID');
  });
  it('applies depth and count limits to nested loop bodies', () => {
    const initial = createDocument(), deepest = loop();
    let nested = deepest;
    for (let i = 1; i < 12; i++) nested = loop([nested]);
    const doc = insertInstruction(initial, initial.program.startId, nested);
    expect(() => insertInstruction(doc, deepest.id, loop(), 'body')).toThrow('BRANCH_DEPTH_LIMIT');
    expect(() => insertInstruction(initial, initial.program.startId, loop(Array.from({ length: 300 }, () => output())))).toThrow('INSTRUCTION_LIMIT');
  });
});
