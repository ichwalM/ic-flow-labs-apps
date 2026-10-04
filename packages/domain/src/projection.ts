import { flowEdgeId, isLoop, mergeId, type FlowBranch, type InsertionPoint, type Instruction, type Position, type ProjectDocument } from './model';

export interface ProjectedEdge {
  id: string; source: string; target: string; insertion: InsertionPoint;
  branch?: FlowBranch; emptyBranch?: boolean; loopBack?: boolean; laneX?: number;
}
export function automaticPositions(doc: ProjectDocument): Record<string, Position> {
  const positions: Record<string, Position> = { [doc.program.startId]: { x: 0, y: 0 } };
  const widths = new Map<string, number>();
  function width(block: Instruction[]): number {
    return Math.max(220, ...block.map(instruction => {
      const size = instruction.kind === 'decision' ? width(instruction.consequent) + 120 + width(instruction.alternate)
        : isLoop(instruction) ? width(instruction.body) + 220 : 220;
      widths.set(instruction.id, size);
      return size;
    }));
  }
  width(doc.program.instructions);
  const blockWidth = (block: Instruction[]) => Math.max(220, ...block.map(instruction => widths.get(instruction.id)!));
  function place(block: Instruction[], center: number, y: number): number {
    for (const instruction of block) {
      positions[instruction.id] = { x: center - 110, y };
      if (instruction.kind === 'decision') {
        const left = blockWidth(instruction.consequent), right = blockWidth(instruction.alternate);
        const leftEnd = place(instruction.consequent, center - (right + 120) / 2, y + 180);
        const rightEnd = place(instruction.alternate, center + (left + 120) / 2, y + 180);
        const joinY = Math.max(leftEnd, rightEnd) + 20;
        positions[mergeId(instruction.id)] = { x: center - 5, y: joinY };
        y = joinY + 110;
      } else if (isLoop(instruction)) {
        const end = place(instruction.body, center, y + 180);
        positions[mergeId(instruction.id)] = { x: center - 5, y: end + 30 };
        y = end + 140;
      } else y += 156;
    }
    return y;
  }
  positions[doc.program.endId] = { x: 0, y: place(doc.program.instructions, 110, 156) };
  return positions;
}
export function projectFlow(doc: ProjectDocument): { positions: Record<string, Position>; edges: ProjectedEdge[] } {
  const positions = { ...automaticPositions(doc), ...doc.layout.positions };
  const edges: ProjectedEdge[] = [];
  function walk(block: Instruction[], source: string, insertion: InsertionPoint, target: string, branch?: FlowBranch) {
    let previous = source, anchor = insertion, entryBranch = branch;
    function edge(to: string, emptyBranch = false) {
      edges.push({ id: flowEdgeId(previous, to, entryBranch), source: previous, target: to, insertion: anchor, branch: entryBranch, emptyBranch });
    }
    for (const instruction of block) {
      edge(instruction.id);
      if (instruction.kind === 'decision') {
        walk(instruction.consequent, instruction.id, { afterId: instruction.id, branch: 'consequent' }, mergeId(instruction.id), 'consequent');
        walk(instruction.alternate, instruction.id, { afterId: instruction.id, branch: 'alternate' }, mergeId(instruction.id), 'alternate');
        previous = mergeId(instruction.id);
      } else if (isLoop(instruction)) {
        // Enclose the projected body, including nested return/exit lanes and manual moves.
        const firstEdge = edges.length;
        walk(instruction.body, instruction.id, { afterId: instruction.id, branch: 'body' }, instruction.id, 'body');
        const bodyEdges = edges.slice(firstEdge);
        const points = bodyEdges.flatMap(e => [e.source, e.target].flatMap(id => [positions[id]!.x, positions[id]!.x + (id.startsWith('merge:') ? 10 : 220)]).concat(e.laneX === undefined ? [] : [e.laneX]));
        const back = edges.at(-1)!;
        back.loopBack = true;
        back.laneX = Math.min(...points) - 85;
        edges.push({ id: flowEdgeId(instruction.id, mergeId(instruction.id), 'exit'), source: instruction.id, target: mergeId(instruction.id), branch: 'exit', laneX: Math.max(...points) + 85, insertion: { afterId: instruction.id } });
        previous = mergeId(instruction.id);
      } else previous = instruction.id;
      anchor = { afterId: instruction.id };
      entryBranch = undefined;
    }
    edge(target, !!branch && block.length === 0);
  }
  walk(doc.program.instructions, doc.program.startId, { afterId: doc.program.startId }, doc.program.endId);
  return { positions, edges };
}
