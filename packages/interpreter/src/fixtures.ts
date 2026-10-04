import type { Instruction, ProjectDocument } from '@flowlab/domain';
type WithoutId<T> = T extends unknown ? Omit<T, 'id'> : never;
export type SourceInstruction = WithoutId<Exclude<Instruction, { kind: 'decision' | 'while' | 'for' }>> | { kind: 'decision'; condition: string; consequent: SourceInstruction[]; alternate: SourceInstruction[] } | { kind: 'while'; condition: string; body: SourceInstruction[] } | { kind: 'for'; counter: string; from: string; to: string; step: string; body: SourceInstruction[] };
export function programFixture(instructions: readonly SourceInstruction[]): ProjectDocument {
  const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
  let counter = 3;
  const block = (items: readonly SourceInstruction[]): Instruction[] => items.map(instruction => {
    const nextId = id(counter++);
    return instruction.kind === 'decision' ? { ...instruction, id: nextId, consequent: block(instruction.consequent), alternate: block(instruction.alternate) } : instruction.kind === 'while' || instruction.kind === 'for' ? { ...instruction, id: nextId, body: block(instruction.body) } : { ...instruction, id: nextId };
  });
  return { schemaVersion: 4, metadata: { id: id(0), title: 'Fixture' }, program: { startId: id(1), endId: id(2), instructions: block(instructions) }, layout: { positions: {} } };
}
export const fixtures = [
  {
    name: '01-hello-world', document: programFixture([{ kind: 'output', mode: 'text', text: 'Halo Dunia' }]), inputs: [], output: ['Halo Dunia'],
    events: ['NODE_ENTER', 'NODE_EXIT', 'FLOW_TRAVERSED', 'NODE_ENTER', 'OUTPUT', 'NODE_EXIT', 'FLOW_TRAVERSED', 'NODE_ENTER', 'NODE_EXIT', 'PROGRAM_FINISHED'],
  },
  {
    name: '02-variable', document: programFixture([
      { kind: 'declaration', name: 'x', dataType: 'Integer', initialValue: '5' },
      { kind: 'assignment', target: 'x', expression: 'x + 2' },
      { kind: 'output', mode: 'expression', text: 'x' },
    ]), inputs: [], output: ['7'],
    events: ['NODE_ENTER', 'NODE_EXIT', 'FLOW_TRAVERSED', 'NODE_ENTER', 'VARIABLE_DECLARE', 'NODE_EXIT', 'FLOW_TRAVERSED', 'NODE_ENTER', 'VARIABLE_UPDATE', 'NODE_EXIT', 'FLOW_TRAVERSED', 'NODE_ENTER', 'OUTPUT', 'NODE_EXIT', 'FLOW_TRAVERSED', 'NODE_ENTER', 'NODE_EXIT', 'PROGRAM_FINISHED'],
  },
  {
    name: '03-arithmetic', document: programFixture([
      { kind: 'declaration', name: 'luas', dataType: 'Real', initialValue: '2 ^ 3 + 10 / 4' },
      { kind: 'output', mode: 'expression', text: '"Luas: " + luas' },
    ]), inputs: [], output: ['Luas: 10.5'],
    events: ['NODE_ENTER', 'NODE_EXIT', 'FLOW_TRAVERSED', 'NODE_ENTER', 'VARIABLE_DECLARE', 'NODE_EXIT', 'FLOW_TRAVERSED', 'NODE_ENTER', 'OUTPUT', 'NODE_EXIT', 'FLOW_TRAVERSED', 'NODE_ENTER', 'NODE_EXIT', 'PROGRAM_FINISHED'],
  },
  {
    name: '04-input-output', document: programFixture([
      { kind: 'declaration', name: 'nilai', dataType: 'Integer', initialValue: '' },
      { kind: 'input', target: 'nilai', prompt: 'Masukkan nilaimu' },
      { kind: 'output', mode: 'expression', text: '"Nilai: " + nilai' },
    ]), inputs: ['80'], output: ['Nilai: 80'],
    events: ['NODE_ENTER', 'NODE_EXIT', 'FLOW_TRAVERSED', 'NODE_ENTER', 'VARIABLE_DECLARE', 'NODE_EXIT', 'FLOW_TRAVERSED', 'NODE_ENTER', 'INPUT_REQUEST', 'VARIABLE_UPDATE', 'NODE_EXIT', 'FLOW_TRAVERSED', 'NODE_ENTER', 'OUTPUT', 'NODE_EXIT', 'FLOW_TRAVERSED', 'NODE_ENTER', 'NODE_EXIT', 'PROGRAM_FINISHED'],
  },
];
