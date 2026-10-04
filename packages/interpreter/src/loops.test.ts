import { describe, expect, it } from 'vitest';
import { flowEdgeId, moveInstruction, projectFlow } from '@flowlab/domain';
import { compileProgram, Interpreter, type ExecutionLimits } from './index';
import { programFixture, type SourceInstruction } from './fixtures';

const declare = (name: string, initialValue = ''): SourceInstruction => ({ kind: 'declaration', name, dataType: 'Integer', initialValue });
const output = (text: string): SourceInstruction => ({ kind: 'output', mode: 'expression', text });
const assign = (target: string, expression: string): SourceInstruction => ({ kind: 'assignment', target, expression });
const whileLoop = (condition: string, body: SourceInstruction[] = []): SourceInstruction => ({ kind: 'while', condition, body });
const forLoop = (counter: string, from: string, to: string, step: string, body: SourceInstruction[] = []): SourceInstruction => ({ kind: 'for', counter, from, to, step, body });
function machine(source: SourceInstruction[], limits: Partial<ExecutionLimits> = {}) {
  const doc = programFixture(source), compiled = compileProgram(doc);
  if (!compiled.ok) throw new Error(JSON.stringify(compiled.diagnostics));
  return { doc, runtime: new Interpreter(compiled.program, limits) };
}
function run(source: SourceInstruction[], batch = 128, limits: Partial<ExecutionLimits> = {}) {
  const { doc, runtime } = machine(source, limits);
  for (let guard = 0; guard < 2000 && runtime.snapshot().status === 'running'; guard++) runtime.advance(batch);
  const state = runtime.snapshot();
  expect(['finished', 'error']).toContain(state.status);
  const edgeIds = new Set(projectFlow(doc).edges.map(edge => edge.id));
  for (const edge of state.traversedEdgeIds) expect(edgeIds.has(edge)).toBe(true);
  for (const event of state.events) if (event.type === 'FLOW_TRAVERSED') expect(edgeIds.has(flowEdgeId(event.sourceId, event.targetId, event.branch))).toBe(true);
  return state;
}

describe('bounded loop execution', () => {
  it.each(['while', 'for'])('prints 1–10 with %s, then resumes the parent with deterministic events', kind => {
    const loop = kind === 'while' ? whileLoop('i <= 10', [output('i'), assign('i', 'i + 1')]) : forLoop('i', '1', '10', '1', [output('i')]);
    const source = [declare('i', '1'), loop, output('"Done"')];
    const state = run(source);
    expect(state.status).toBe('finished');
    expect(state.output).toEqual([...Array.from({ length: 10 }, (_, i) => String(i + 1)), 'Done']);
    expect(state.variables[0]?.value?.value).toBe(11);
    expect(state.events.filter(event => event.type === 'CONDITION_EVALUATED')).toHaveLength(11);
    expect(run(source, 1)).toEqual(state);
  });
  it.each([
    ['5', '1', '-2', ['5', '3', '1'], -1],
    ['1', '6', '2', ['1', '3', '5'], 7],
    ['3', '3', '-1', ['3'], 2],
    ['3', '1', '1', [], 3],
    ['1', '3', '-1', [], 1],
  ] as const)('honors inclusive range %s…%s step %s', (from, to, step, expected, final) => {
    const state = run([declare('i'), forLoop('i', from, to, step, [output('i')])]);
    expect(state.output).toEqual(expected);
    expect(state.variables[0]?.value?.value).toBe(final);
  });
  it('skips a false while body, leaving outer values intact', () => {
    const state = run([declare('i', '0'), whileLoop('false', [assign('i', '5'), output('1 / 0')]), output('i')]);
    expect(state.output).toEqual(['0']);
    expect(state.executionCount).toBe(3);
  });
  it('captures all for bounds once, before assigning the counter', () => {
    const state = run([declare('i', '2'), declare('end', '4'), declare('delta', '1'), forLoop('i', 'i', 'end', 'delta', [output('i'), assign('end', '0'), assign('delta', '-1')]), output('i')]);
    expect(state.output).toEqual(['2', '3', '4', '5']);
  });
  it('reinitializes a nested for each outer iteration and supports decisions in its body', () => {
    const source: SourceInstruction[] = [declare('i'), declare('j'), forLoop('i', '1', '2', '1', [forLoop('j', '2', '1', '-1', [{ kind: 'decision', condition: 'j == 1', consequent: [output('i * 10 + j')], alternate: [output('i * 100 + j')] }])])];
    expect(run(source).output).toEqual(['102', '11', '202', '21']);
    expect(run(source, 1)).toEqual(run(source));
  });
  it('supports while inside for and for inside while, independently of coordinates', () => {
    const source = [declare('i', '1'), declare('j'), whileLoop('i <= 2', [forLoop('j', '1', '2', '1', [output('i * 10 + j')]), assign('i', 'i + 1')])];
    const { doc } = machine(source);
    const compiled = compileProgram(moveInstruction(doc, doc.program.instructions[2]!.id, { x: -800, y: 2000 }));
    if (!compiled.ok) throw new Error('fixture');
    expect(new Interpreter(compiled.program).advance()).toEqual(run(source));
    expect(run([declare('i'), declare('j'), forLoop('i', '1', '2', '1', [assign('j', '2'), whileLoop('j > 0', [output('j'), assign('j', 'j - 1')])])]).output).toEqual(['2', '1', '2', '1']);
  });
  it('creates local declarations anew per iteration and removes nested locals only', () => {
    const source = [declare('i'), declare('total', '0'), forLoop('i', '1', '2', '1', [declare('x', 'i'), declare('j'), forLoop('j', '1', '2', '1', [declare('y', 'j'), assign('total', 'total + x + y')]), output('x')]), output('total')];
    const state = run(source);
    expect(state.output).toEqual(['1', '2', '12']);
    expect(state.variables.map(variable => variable.name)).toEqual(['i', 'total']);
    expect(state.events.filter(event => event.type === 'VARIABLE_SCOPE_EXIT')).toHaveLength(6);
    expect(run(source, 1)).toEqual(state);
  });
  it('accepts matching declarations inside decisions for each loop iteration', () => {
    const state = run([declare('i'), forLoop('i', '1', '2', '1', [{ kind: 'decision', condition: 'i == 1', consequent: [declare('x', '10')], alternate: [declare('x', '20')] }, output('x')])]);
    expect(state.output).toEqual(['10', '20']);
    expect(state.variables.map(v => v.name)).toEqual(['i']);
  });
  it('waits for repeated input at the same node, retries, and resumes the correct iteration', () => {
    const { runtime } = machine([declare('i'), declare('x'), forLoop('i', '1', '2', '1', [{ kind: 'input', target: 'x', prompt: 'Value' }, output('x')])]);
    const first = runtime.advance();
    expect(first.status).toBe('waiting_for_input');
    expect(runtime.submitInput('bad')?.code).toBe('INPUT_INVALID');
    expect(runtime.snapshot()).toEqual(first);
    runtime.submitInput('8');
    const second = runtime.advance();
    expect(second.status).toBe('waiting_for_input');
    expect(second.inputRequest?.instructionId).toBe(first.inputRequest?.instructionId);
    expect(second.output).toEqual(['8']);
    runtime.submitInput('9');
    expect(runtime.advance().output).toEqual(['8', '9']);
    expect(runtime.snapshot().status).toBe('finished');
  });
  it.each(['0', '1 - 1'])('rejects zero step %s before counter assignment or body output', step => {
    const state = run([declare('i', '7'), forLoop('i', '1', '5', step, [output('i')])]);
    expect(state.diagnostics[0]?.code).toBe('FOR_STEP_ZERO');
    expect(state.variables[0]?.value?.value).toBe(7);
    expect(state.output).toEqual([]);
  });
  it('reports counter overflow instead of losing precision', () => {
    expect(run([declare('i'), forLoop('i', '9007199254740991', '9007199254740991', '1')]).diagnostics[0]?.code).toBe('NUMBER_RANGE');
  });
  it.each([whileLoop('true'), whileLoop('true', [whileLoop('false')])])('bounds an infinite loop including an empty body', loop => {
    const state = run([loop], 128, { maxSteps: 101, maxEvents: 10 });
    expect(state.executionCount).toBe(101);
    expect(state.diagnostics[0]?.code).toBe('STEP_LIMIT');
    expect(state.events).toHaveLength(10);
    expect(state.events.at(-1)?.type).toBe('RUNTIME_ERROR');
    expect(state.visitedNodeIds[0]).toBe(programFixture([loop]).program.startId);
  });
  it('bounds output from loops and preserves output before the error', () => {
    const state = run([whileLoop('true', [output('"abc"')])], 128, { maxOutput: 10 });
    expect(state.output).toEqual(['abc', 'abc']);
    expect(state.diagnostics[0]?.code).toBe('OUTPUT_LIMIT');
  });
  it('stops a running loop and a loop waiting for input; late calls cannot resume it', () => {
    for (const source of [[whileLoop('true')], [declare('x'), whileLoop('true', [{ kind: 'input', target: 'x', prompt: '' } as SourceInstruction])]]) {
      const { runtime } = machine(source);
      runtime.advance(1);
      runtime.advance(1);
      const stopped = runtime.stop();
      expect(stopped.status).toBe('stopped');
      expect(stopped.inputRequest).toBeNull();
      runtime.submitInput('2');
      expect(runtime.advance()).toEqual(stopped);
    }
  });
});

describe('loop semantic validation', () => {
  const cases: [string, SourceInstruction[], string][] = [
    ['non Boolean while', [whileLoop('1')], 'TYPE_MISMATCH'],
    ['unknown counter', [forLoop('i', '1', '2', '1')], 'VARIABLE_NOT_DECLARED'],
    ['non Integer bounds', [declare('i'), forLoop('i', '1', '2 / 1', '1')], 'TYPE_MISMATCH'],
    ['uninitialized bounds', [declare('i'), forLoop('i', 'i', '2', '1')], 'VARIABLE_UNINITIALIZED'],
    ['write counter', [declare('i'), forLoop('i', '1', '2', '1', [assign('i', '8')])], 'FOR_COUNTER_READONLY'],
    ['input counter', [declare('i'), forLoop('i', '1', '2', '1', [{ kind: 'input', target: 'i', prompt: '' }])], 'FOR_COUNTER_READONLY'],
    ['reuse active counter', [declare('i'), forLoop('i', '1', '2', '1', [forLoop('i', '1', '3', '1')])], 'FOR_COUNTER_READONLY'],
    ['write counter in nested decision', [declare('i'), forLoop('i', '1', '2', '1', [{ kind: 'decision', condition: 'true', consequent: [assign('i', '7')], alternate: [] }])], 'FOR_COUNTER_READONLY'],
    ['uncertain while initialization', [declare('x'), whileLoop('false', [assign('x', '1')]), output('x')], 'VARIABLE_UNINITIALIZED'],
    ['uncertain for initialization', [declare('i'), declare('x'), forLoop('i', '1', '2', '1', [assign('x', '1')]), output('x')], 'VARIABLE_UNINITIALIZED'],
    ['local variable after loop', [whileLoop('false', [declare('x', '1')]), output('x')], 'VARIABLE_NOT_DECLARED'],
    ['shadowing outer variable', [declare('x'), whileLoop('true', [declare('x', '1')])], 'DUPLICATE_VARIABLE'],
  ];
  it.each(cases)('rejects %s before execution', (_, source, code) => {
    const result = compileProgram(programFixture(source));
    expect(result.ok).toBe(false);
    expect(result.diagnostics).toContainEqual(expect.objectContaining({ code, instructionId: expect.any(String) }));
  });
  it('allows initialization of a for counter even when no iterations run', () => {
    expect(run([declare('i'), forLoop('i', '3', '1', '1'), output('i')]).output).toEqual(['3']);
  });
});
