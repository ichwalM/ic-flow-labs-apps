import { describe, expect, it } from 'vitest';
import { arrange, automaticPositions, commit, createDocument, deleteInstruction, findInstruction, flattenInstructions, insertInstruction, MAX_BRANCH_DEPTH, mergeId, moveInstruction, nodeIds, positionOf, projectFlow, redo, undo, updateInstruction, type Instruction } from './index';

const output = (text: string): Instruction => ({ id: crypto.randomUUID(), kind: 'output', mode: 'text', text });
const decision = (consequent: Instruction[] = [], alternate: Instruction[] = []): Extract<Instruction, { kind: 'decision' }> => ({ id: crypto.randomUUID(), kind: 'decision', condition: 'true', consequent, alternate });

describe('structured branches and projection', () => {
  it('inserts at branch entry, within a branch and after a merge without changing its sibling', () => {
    let doc = createDocument();
    const no = output('No'), yes = output('Yes'), first = output('First'), last = output('Last'), after = output('After');
    const branch = decision([], [no]);
    doc = insertInstruction(doc, doc.program.startId, branch);
    doc = insertInstruction(doc, branch.id, yes, 'consequent');
    doc = insertInstruction(doc, branch.id, first, 'consequent');
    doc = insertInstruction(doc, yes.id, last);
    doc = insertInstruction(doc, branch.id, after);
    expect(doc.program.instructions).toEqual([{ ...branch, consequent: [first, yes, last] }, after]);
    expect(findInstruction(doc, last.id)).toEqual(last);
    expect(branch.consequent).toEqual([]);
  });

  it('projects two distinct empty branch edges and an insertion point after the merge', () => {
    const initial = createDocument(), branch = decision();
    const doc = insertInstruction(initial, initial.program.startId, branch);
    const { edges, positions } = projectFlow(doc);
    expect(new Set(edges.map(edge => edge.id)).size).toBe(4);
    expect(edges.filter(edge => edge.source === branch.id)).toMatchObject([
      { target: mergeId(branch.id), branch: 'consequent', emptyBranch: true, insertion: { afterId: branch.id, branch: 'consequent' } },
      { target: mergeId(branch.id), branch: 'alternate', emptyBranch: true, insertion: { afterId: branch.id, branch: 'alternate' } },
    ]);
    expect(edges.at(-1)).toMatchObject({ source: mergeId(branch.id), target: doc.program.endId, insertion: { afterId: branch.id } });
    expect(positions[mergeId(branch.id)]!.y).toBeGreaterThan(positions[branch.id]!.y);
    expect(nodeIds(doc)).not.toContain(mergeId(branch.id));
  });

  it('rejoins nested branches at their own merge before resuming the parent', () => {
    const initial = createDocument(), leaf = output('Leaf'), sibling = output('Sibling'), after = output('After');
    const nested = decision([leaf]), parent = decision([nested], [sibling]);
    let doc = insertInstruction(initial, initial.program.startId, parent);
    doc = insertInstruction(doc, parent.id, after);
    const edges = projectFlow(doc).edges;
    expect(edges).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: leaf.id, target: mergeId(nested.id) }),
      expect.objectContaining({ source: mergeId(nested.id), target: mergeId(parent.id), insertion: { afterId: nested.id } }),
      expect.objectContaining({ source: sibling.id, target: mergeId(parent.id) }),
      expect.objectContaining({ source: mergeId(parent.id), target: after.id }),
    ]));
    const moved = moveInstruction(doc, leaf.id, { x: 800, y: -100 });
    expect(projectFlow(moved).edges).toEqual(edges);
    expect(moved.program).toBe(doc.program);
  });

  it('deletes a subtree and its layout atomically, with undo and redo', () => {
    const initial = createDocument(), leaf = output('Leaf'), other = output('Other');
    const nested = decision([leaf]), parent = decision([nested], [other]);
    const doc = insertInstruction(initial, initial.program.startId, parent);
    const next = deleteInstruction(doc, nested.id);
    expect(findInstruction(next, parent.id)).toEqual({ ...parent, consequent: [] });
    expect(nodeIds(next)).not.toContain(leaf.id);
    expect(Object.keys(next.layout.positions).sort()).toEqual(nodeIds(next).sort());
    expect(projectFlow(next).positions).not.toHaveProperty(mergeId(nested.id));
    const history = commit({ present: doc, past: [], future: [] }, next);
    expect(undo(history).present).toEqual(doc);
    expect(redo(undo(history)).present).toEqual(next);
    expect(deleteInstruction(next, parent.id).program.instructions).toEqual([]);
  });

  it('updates a nested condition while retaining its children even from a stale form', () => {
    const initial = createDocument(), child = decision([output('Keep')]), parent = decision([child]);
    const doc = insertInstruction(initial, initial.program.startId, parent);
    const next = updateInstruction(doc, { ...child, condition: 'false', consequent: [], alternate: [] });
    expect(findInstruction(next, child.id)).toEqual({ ...child, condition: 'false' });
  });

  it('preserves manual offsets through insertion and deletion; arrange removes offsets', () => {
    const initial = createDocument(), child = output('Child'), branch = decision([child]);
    let doc = insertInstruction(initial, initial.program.startId, branch);
    const origin = positionOf(doc, child.id), added = output('Added');
    doc = moveInstruction(doc, child.id, { x: origin.x + 80, y: origin.y + 20 });
    const inserted = insertInstruction(doc, branch.id, added, 'consequent');
    const automatic = automaticPositions(inserted)[child.id]!;
    expect(positionOf(inserted, child.id)).toEqual({ x: automatic.x + 80, y: automatic.y + 20 });
    expect(deleteInstruction(inserted, added.id)).toEqual(doc);
    expect(positionOf(arrange(inserted), child.id)).toEqual(automatic);
  });

  it('rejects branch insertion on a terminal or ordinary instruction and duplicate nested IDs', () => {
    const initial = createDocument(), child = output('Child');
    const doc = insertInstruction(initial, initial.program.startId, child);
    expect(() => insertInstruction(doc, doc.program.startId, decision(), 'consequent')).toThrow('INVALID_INSERT_POINT');
    expect(() => insertInstruction(doc, child.id, decision(), 'alternate')).toThrow('INVALID_INSERT_POINT');
    expect(() => insertInstruction(doc, child.id, decision([child]))).toThrow('DUPLICATE_ID');
    const repeated = output('Repeated');
    expect(() => insertInstruction(doc, child.id, decision([repeated], [repeated]))).toThrow('DUPLICATE_ID');
  });

  it('counts both branches against the instruction limit', () => {
    const initial = createDocument(), branch = decision(Array.from({ length: 149 }, () => output('A')), Array.from({ length: 150 }, () => output('B')));
    const doc = insertInstruction(initial, initial.program.startId, branch);
    expect(flattenInstructions(doc.program.instructions)).toHaveLength(300);
    expect(() => insertInstruction(doc, branch.id, output('Overflow'), 'alternate')).toThrow('INSTRUCTION_LIMIT');
  });

  it('allows twelve nested decisions and rejects the thirteenth without changing the document', () => {
    const initial = createDocument(), deepest = decision();
    let root = deepest;
    for (let i = 1; i < MAX_BRANCH_DEPTH; i++) root = decision([root]);
    const doc = insertInstruction(initial, initial.program.startId, root);
    expect(() => insertInstruction(doc, deepest.id, decision(), 'consequent')).toThrow('BRANCH_DEPTH_LIMIT');
    expect(insertInstruction(doc, deepest.id, output('Allowed'), 'alternate').program.instructions).toHaveLength(1);
    expect(flattenInstructions(doc.program.instructions)).toHaveLength(MAX_BRANCH_DEPTH);
  });
});
