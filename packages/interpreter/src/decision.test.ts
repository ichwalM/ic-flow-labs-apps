import { describe, expect, it } from 'vitest';
import { flattenInstructions, flowEdgeId, mergeId, moveInstruction, projectFlow } from '@flowlab/domain';
import { compileProgram, Interpreter } from './index';
import { programFixture, type SourceInstruction } from './fixtures';

const output = (text: string, mode: 'text' | 'expression' = 'text'): SourceInstruction => ({ kind: 'output', text, mode });
const declaration = (initialValue = '', name = 'x'): SourceInstruction => ({ kind: 'declaration', name, dataType: 'Integer', initialValue });
const assignment = (expression: string): SourceInstruction => ({ kind: 'assignment', target: 'x', expression });
const decision = (condition: string, consequent: SourceInstruction[] = [], alternate: SourceInstruction[] = []): SourceInstruction => ({ kind: 'decision', condition, consequent, alternate });
function run(source: SourceInstruction[], inputs: string[] = [], batch = 32) {
  const doc = programFixture(source), result = compileProgram(doc);
  if (!result.ok) throw new Error(JSON.stringify(result.diagnostics));
  const machine = new Interpreter(result.program);
  let input = 0;
  for (let guard = 0; guard < 100; guard++) {
    const state = machine.advance(batch);
    if (state.status === 'waiting_for_input') {
      if (input >= inputs.length) throw new Error('MISSING_TEST_INPUT');
      expect(machine.submitInput(inputs[input++]!)).toBeNull();
    } else if (state.status !== 'running') break;
  }
  return { doc, machine, state: machine.snapshot() };
}

describe('branch execution and traces', () => {
  it.each([['80', 'Lulus', 'consequent'], ['60', 'Tidak Lulus', 'alternate']] as const)('routes score %s to %s and resumes after the merge', (input, expected, branch) => {
    const source: SourceInstruction[] = [declaration(), { kind: 'input', target: 'x', prompt: 'Nilai' }, decision('x >= 75', [output('Lulus')], [output('Tidak Lulus')]), output('Selesai')];
    const { doc, state } = run(source, [input]);
    expect(state.status).toBe('finished');
    expect(state.output).toEqual([expected, 'Selesai']);
    expect(state.executionCount).toBe(5);
    const node = doc.program.instructions[2]!;
    expect(state.events.find(event => event.type === 'CONDITION_EVALUATED')).toMatchObject({ instructionId: node.id, result: input === '80', branch });
    expect(run(source, [input], 1).state).toEqual(state);
    const projected = new Set(projectFlow(doc).edges.map(edge => edge.id));
    for (const event of state.events) if (event.type === 'FLOW_TRAVERSED') expect(projected.has(flowEdgeId(event.sourceId, event.targetId, event.branch))).toBe(true);
  });

  it('takes nested branches, exits both merges, and produces the same result after manual movement', () => {
    const source = [decision('true', [decision('false', [output('Skipped')], [output('Nested')])], [output('Skipped outer')]), output('After')];
    const { doc, state } = run(source, [], 1);
    const outer = doc.program.instructions[0]!;
    if (outer.kind !== 'decision') throw new Error('fixture');
    const inner = outer.consequent[0]!;
    expect(state.output).toEqual(['Nested', 'After']);
    expect(state.events.filter(event => event.type === 'FLOW_TRAVERSED').map(event => event.targetId)).toEqual([
      outer.id, inner.id, inner.kind === 'decision' ? inner.alternate[0]!.id : '', mergeId(inner.id), mergeId(outer.id), doc.program.instructions[1]!.id, doc.program.endId,
    ]);
    const changedLayout = flattenInstructions(doc.program.instructions).reduce((current, instruction, index) => moveInstruction(current, instruction.id, { x: index * -500, y: index * -100 }), doc);
    const compiled = compileProgram(changedLayout);
    if (!compiled.ok) throw new Error('fixture');
    expect(new Interpreter(compiled.program).advance()).toEqual(state);
  });

  it.each(['true', 'false'])('records the correct edge for empty %s branches, without phantom steps', condition => {
    const { doc, state } = run([decision(condition), output('After')]);
    expect(state.status).toBe('finished');
    expect(state.executionCount).toBe(2);
    expect(state.events).toContainEqual(expect.objectContaining({ type: 'FLOW_TRAVERSED', sourceId: doc.program.instructions[0]!.id, targetId: mergeId(doc.program.instructions[0]!.id), branch: condition === 'true' ? 'consequent' : 'alternate' }));
    expect(state.output).toEqual(['After']);
  });

  it('does not evaluate runtime failures on an unchosen path and short-circuits conditions', () => {
    const { state } = run([decision('true OR 1 / 0 > 0', [output('Safe')], [output('1 / 0', 'expression')])]);
    expect(state.status).toBe('finished');
    expect(state.output).toEqual(['Safe']);
    expect(state.diagnostics).toEqual([]);
  });

  it('retains the nested frame across invalid input, then rejoins exactly once', () => {
    const doc = programFixture([declaration(), decision('true', [decision('false', [assignment('0')], [{ kind: 'input', target: 'x', prompt: 'Nested input' }]), output('x', 'expression')]), output('Done')]);
    const result = compileProgram(doc);
    if (!result.ok) throw new Error('fixture');
    const machine = new Interpreter(result.program), waiting = machine.advance();
    expect(waiting.inputRequest?.prompt).toBe('Nested input');
    expect(machine.submitInput('bad')?.code).toBe('INPUT_INVALID');
    expect(machine.advance()).toEqual(waiting);
    expect(machine.submitInput('42')).toBeNull();
    const finished = machine.advance();
    expect(finished.status).toBe('finished');
    expect(finished.output).toEqual(['42', 'Done']);
    expect(finished.events.filter(event => event.type === 'CONDITION_EVALUATED')).toHaveLength(2);
    expect(machine.advance()).toEqual(finished);
  });

  it('stops on a failing nested condition without entering either branch or the continuation', () => {
    const { state } = run([output('Before'), decision('true', [decision('1 / 0 > 0', [output('No')], [output('Never')])]), output('After')]);
    expect(state.status).toBe('error');
    expect(state.output).toEqual(['Before']);
    expect(state.diagnostics[0]?.code).toBe('DIVISION_BY_ZERO');
    expect(state.events.filter(event => event.type === 'CONDITION_EVALUATED')).toHaveLength(1);
    expect(state.events.some(event => event.type === 'PROGRAM_FINISHED')).toBe(false);
  });

  it('counts decisions against the execution limit and cancels waiting input inside a branch', () => {
    const doc = programFixture([declaration(), decision('true', [{ kind: 'input', target: 'x', prompt: '' }]), output('Done')]);
    const result = compileProgram(doc);
    if (!result.ok) throw new Error('fixture');
    const limited = new Interpreter(result.program, { maxSteps: 1 }).advance();
    expect(limited.diagnostics[0]?.code).toBe('STEP_LIMIT');
    expect(limited.events.some(event => event.type === 'CONDITION_EVALUATED')).toBe(false);
    const machine = new Interpreter(result.program);
    expect(machine.advance().status).toBe('waiting_for_input');
    const stopped = machine.stop();
    machine.submitInput('5');
    expect(machine.advance()).toEqual(stopped);
    expect(stopped.output).toEqual([]);
    expect(stopped.events.at(-1)?.type).toBe('PROGRAM_STOPPED');
  });
});

describe('definite declaration and initialization across branches', () => {
  const cases: [string, SourceInstruction[], string][] = [
    ['non-Boolean condition', [decision('1')], 'TYPE_MISMATCH'],
    ['unknown condition variable', [decision('x > 0')], 'VARIABLE_NOT_DECLARED'],
    ['uninitialized condition variable', [declaration(), decision('x > 0')], 'VARIABLE_UNINITIALIZED'],
    ['declaration in one branch', [decision('true', [declaration('1')]), output('x', 'expression')], 'VARIABLE_NOT_ALWAYS_DECLARED'],
    ['initialization in one branch', [declaration(), decision('true', [assignment('1')]), output('x', 'expression')], 'VARIABLE_UNINITIALIZED'],
    ['different branch declaration types', [decision('true', [declaration('1')], [{ kind: 'declaration', name: 'x', dataType: 'String', initialValue: '"no"' }])], 'TYPE_MISMATCH'],
    ['reading a sibling declaration', [decision('true', [declaration('1')], [output('x', 'expression')])], 'VARIABLE_NOT_DECLARED'],
    ['nested initialization missing a path', [declaration(), decision('true', [decision('true', [assignment('1')])], [assignment('2')]), output('x', 'expression')], 'VARIABLE_UNINITIALIZED'],
    ['redeclaration after a conditional declaration', [decision('true', [declaration('1')]), declaration('2')], 'DUPLICATE_VARIABLE'],
    ['redeclaration of an outer variable', [declaration('0'), decision('true', [declaration('1')])], 'DUPLICATE_VARIABLE'],
    ['invalid unchosen branch', [decision('true', [output('Valid')], [output('missing', 'expression')])], 'VARIABLE_NOT_DECLARED'],
  ];
  it.each(cases)('rejects %s before any execution', (_, source, code) => {
    const result = compileProgram(programFixture(source));
    expect(result.ok).toBe(false);
    expect(result).not.toHaveProperty('program');
    expect(result.diagnostics).toContainEqual(expect.objectContaining({ code, instructionId: expect.any(String) }));
  });

  it.each(['true', 'false'])('allows matching declarations in both branches (%s)', condition => {
    const { state } = run([decision(condition, [declaration('1')], [declaration('2')]), assignment('x + 10'), output('x', 'expression')]);
    expect(state.status).toBe('finished');
    expect(state.output).toEqual([condition === 'true' ? '11' : '12']);
    expect(state.variables).toHaveLength(1);
  });

  it('allows an outer variable assigned in every nested path and a preinitialized variable without else', () => {
    expect(run([declaration(), decision('true', [decision('false', [assignment('1')], [assignment('2')])], [assignment('3')]), output('x', 'expression')]).state.output).toEqual(['2']);
    expect(run([declaration('4'), decision('false', [assignment('5')]), output('x', 'expression')]).state.output).toEqual(['4']);
  });
});
