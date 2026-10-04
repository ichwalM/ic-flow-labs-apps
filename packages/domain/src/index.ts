import { childBlocks, isLoop, findInstruction, flattenInstructions, MAX_BRANCH_DEPTH, MAX_INSTRUCTIONS, nodeIds, type Branch, type Instruction, type Position, type ProjectDocument } from './model';
import { automaticPositions } from './projection';
export * from './model';
export * from './projection';
export function createDocument(): ProjectDocument {
  return {
    schemaVersion: 4,
    metadata: { id: crypto.randomUUID(), title: 'Algoritma pertamaku' },
    program: { startId: crypto.randomUUID(), endId: crypto.randomUUID(), instructions: [] },
    layout: { positions: {} },
  };
}
export function positionOf(doc: ProjectDocument, id: string): Position {
  return doc.layout.positions[id] ?? automaticPositions(doc)[id] ?? { x: 0, y: 0 };
}
export function arrange(doc: ProjectDocument): ProjectDocument {
  const positions = automaticPositions(doc);
  return { ...doc, layout: { positions: Object.fromEntries(nodeIds(doc).map((id) => [id, positions[id]!])) } };
}
function mapBlock(block: Instruction[], transform: (block: Instruction[]) => Instruction[]): Instruction[] {
  return transform(block.map((i) => i.kind === 'decision' ? { ...i, consequent: mapBlock(i.consequent, transform), alternate: mapBlock(i.alternate, transform) } : isLoop(i) ? { ...i, body: mapBlock(i.body, transform) } : i));
}
function reflow(previous: ProjectDocument, next: ProjectDocument): ProjectDocument {
  const before = automaticPositions(previous), after = automaticPositions(next);
  return { ...next, layout: { positions: Object.fromEntries(nodeIds(next).map((id) => {
    const old = previous.layout.positions[id], origin = before[id], point = after[id]!;
    return [id, old && origin ? { x: Math.max(-100000, Math.min(100000, point.x + old.x - origin.x)), y: Math.max(-100000, Math.min(100000, point.y + old.y - origin.y)) } : point];
  })) } };
}
export function insertInstruction(doc: ProjectDocument, afterId: string, instruction: Instruction, branch?: Branch): ProjectDocument {
  const ids = nodeIds(doc);
  const anchor = findInstruction(doc, afterId);
  if (!ids.includes(afterId) || afterId === doc.program.endId || (branch && !anchor) || (branch === 'body' && (!anchor || !isLoop(anchor))) || (branch && branch !== 'body' && findInstruction(doc, afterId)?.kind !== 'decision')) throw new Error('INVALID_INSERT_POINT');
  const added = flattenInstructions([instruction]).map((i) => i.id);
  if (new Set(added).size !== added.length || added.some((id) => ids.includes(id))) throw new Error('DUPLICATE_ID');
  if (ids.length - 2 + added.length > MAX_INSTRUCTIONS) throw new Error('INSTRUCTION_LIMIT');
  let instructions = mapBlock(doc.program.instructions, (block) => {
    if (branch) return block.map((i) => i.id !== afterId ? i : branch === 'body' && isLoop(i) ? { ...i, body: [instruction, ...i.body] } : branch !== 'body' && i.kind === 'decision' ? { ...i, [branch]: [instruction, ...i[branch]] } : i);
    const index = block.findIndex((i) => i.id === afterId);
    return index < 0 ? block : [...block.slice(0, index + 1), instruction, ...block.slice(index + 1)];
  });
  if (afterId === doc.program.startId) instructions = [instruction, ...instructions];
  function checkDepth(block: Instruction[], depth = 0): void {
    for (const i of block) if (childBlocks(i).length) {
      if (depth >= MAX_BRANCH_DEPTH) throw new Error('BRANCH_DEPTH_LIMIT');
      for (const children of childBlocks(i)) checkDepth(children, depth + 1);
    }
  }
  checkDepth(instructions);
  return reflow(doc, { ...doc, program: { ...doc.program, instructions } });
}
export function updateInstruction(doc: ProjectDocument, instruction: Instruction): ProjectDocument {
  const current = findInstruction(doc, instruction.id);
  if (!current || current.kind !== instruction.kind) throw new Error('INVALID_INSTRUCTION');
  const instructions = mapBlock(doc.program.instructions, (block) => block.map((i) => i.id === instruction.id ? i.kind === 'decision' && instruction.kind === 'decision' ? { ...i, condition: instruction.condition } : isLoop(i) && isLoop(instruction) ? { ...instruction, body: i.body } : instruction : i));
  return { ...doc, program: { ...doc.program, instructions } };
}
export function deleteInstruction(doc: ProjectDocument, id: string): ProjectDocument {
  const current = findInstruction(doc, id);
  if (!current) return doc;
  return reflow(doc, { ...doc, program: { ...doc.program, instructions: mapBlock(doc.program.instructions, (block) => block.filter((i) => i.id !== id)) } });
}
export function moveInstruction(doc: ProjectDocument, id: string, position: Position): ProjectDocument {
  if (!nodeIds(doc).includes(id) || !Number.isFinite(position.x) || !Number.isFinite(position.y)) return doc;
  const bound = (n: number) => Math.max(-100000, Math.min(100000, n));
  return { ...doc, layout: { positions: { ...doc.layout.positions, [id]: { x: bound(position.x), y: bound(position.y) } } } };
}
export function instructionLabel(instruction: Instruction): string {
  switch (instruction.kind) {
    case 'declaration': return `${instruction.name} : ${instruction.dataType}${instruction.initialValue ? ` = ${instruction.initialValue}` : ''}`;
    case 'assignment': return `${instruction.target} ← ${instruction.expression}`;
    case 'input': return `INPUT ${instruction.target}`;
    case 'output': return instruction.mode === 'expression' ? `OUTPUT ${instruction.text}` : `“${instruction.text}”`;
    case 'while': return `WHILE ${instruction.condition}`;
    case 'for': return `FOR ${instruction.counter}: ${instruction.from} → ${instruction.to} (${instruction.step})`;
    case 'decision': return `${instruction.condition} ?`;
  }
}
export interface History { present: ProjectDocument; past: ProjectDocument[]; future: ProjectDocument[] }
export function commit(history: History, next: ProjectDocument): History {
  if (JSON.stringify(history.present) === JSON.stringify(next)) return history;
  return { present: next, past: [...history.past, history.present].slice(-60), future: [] };
}
export function undo(history: History): History {
  const previous = history.past.at(-1);
  return previous ? { present: previous, past: history.past.slice(0, -1), future: [history.present, ...history.future] } : history;
}
export function redo(history: History): History {
  const next = history.future[0];
  return next ? { present: next, past: [...history.past, history.present], future: history.future.slice(1) } : history;
}
