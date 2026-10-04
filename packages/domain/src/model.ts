export const dataTypes = ['Integer', 'Real', 'Boolean', 'Character', 'String'] as const;
export type DataType = (typeof dataTypes)[number];
export type Branch = 'consequent' | 'alternate' | 'body';
export type FlowBranch = Branch | 'exit';
export type Instruction =
  | { id: string; kind: 'declaration'; name: string; dataType: DataType; initialValue: string }
  | { id: string; kind: 'assignment'; target: string; expression: string }
  | { id: string; kind: 'input'; target: string; prompt: string }
  | { id: string; kind: 'output'; mode: 'text' | 'expression'; text: string }
  | { id: string; kind: 'decision'; condition: string; consequent: Instruction[]; alternate: Instruction[] }
  | { id: string; kind: 'while'; condition: string; body: Instruction[] }
  | { id: string; kind: 'for'; counter: string; from: string; to: string; step: string; body: Instruction[] };
export type InstructionKind = Instruction['kind'];
export type Position = { x: number; y: number };
export interface ProjectDocument {
  schemaVersion: 4;
  metadata: { id: string; title: string };
  program: { startId: string; endId: string; instructions: Instruction[] };
  layout: { positions: Record<string, Position> };
}
export const MAX_INSTRUCTIONS = 300;
export const MAX_BRANCH_DEPTH = 12;
export const VARIABLE_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
export interface InsertionPoint { afterId: string; branch?: Branch }
export const mergeId = (id: string) => `merge:${id}`;
export const flowEdgeId = (source: string, target: string, branch?: FlowBranch) => `${source}:${target}:${branch ?? ''}`;
export function childBlocks(instruction: Instruction): Instruction[][] {
  if (instruction.kind === 'decision') return [instruction.consequent, instruction.alternate];
  return isLoop(instruction) ? [instruction.body] : [];
}
export function isLoop(instruction: Instruction): instruction is Extract<Instruction, { kind: 'while' | 'for' }> {
  return instruction.kind === 'while' || instruction.kind === 'for';
}
export function flattenInstructions(block: readonly Instruction[]): Instruction[] {
  return block.flatMap(instruction => [instruction, ...childBlocks(instruction).flatMap(flattenInstructions)]);
}
export function findInstruction(doc: ProjectDocument, id: string): Instruction | undefined {
  return flattenInstructions(doc.program.instructions).find((instruction) => instruction.id === id);
}
export function nodeIds(doc: ProjectDocument): string[] {
  return [doc.program.startId, ...flattenInstructions(doc.program.instructions).map((i) => i.id), doc.program.endId];
}
