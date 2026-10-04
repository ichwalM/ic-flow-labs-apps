import { describe, expect, it } from 'vitest';
import { compileProgram, Interpreter, parseInput } from './index';
import { fixtures, programFixture, type SourceInstruction } from './fixtures';

function machine(instructions: SourceInstruction[], limits = {}) {
  const compiled = compileProgram(programFixture(instructions));
  if (!compiled.ok) throw new Error(JSON.stringify(compiled.diagnostics));
  return new Interpreter(compiled.program, limits);
}
describe('deterministic fixture programs', () => {
  for (const fixture of fixtures) it(fixture.name, () => {
    const result = compileProgram(fixture.document);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const program = result.program;
    function run(batch: number) {
      const runtime = new Interpreter(program);
      let input = 0;
      for (let guard = 0; guard < 50; guard++) {
        const state = runtime.advance(batch);
        if (state.status === 'waiting_for_input') runtime.submitInput(fixture.inputs[input++]!);
        if (state.status === 'finished' || state.status === 'error') break;
      }
      return runtime.snapshot();
    }
    const state = run(32);
    expect(state.status).toBe('finished');
    expect(state.output).toEqual(fixture.output);
    expect(state.events.map((event) => event.type)).toEqual(fixture.events);
    expect(state.events.map((event) => event.sequence)).toEqual(state.events.map((_, index) => index));
    expect(run(1)).toEqual(state);
  });
});
describe('semantic validation', () => {
  const declaration: SourceInstruction = { kind: 'declaration', name: 'x', dataType: 'Integer', initialValue: '0' };
  it.each([
    [[{ kind: 'output', mode: 'expression', text: 'x' }, declaration], 'VARIABLE_NOT_DECLARED'],
    [[{ ...declaration, initialValue: '' }, { kind: 'output', mode: 'expression', text: 'x' }], 'VARIABLE_UNINITIALIZED'],
    [[declaration, declaration], 'DUPLICATE_VARIABLE'],
    [[{ ...declaration, name: 'AND' }], 'RESERVED_NAME'],
    [[{ ...declaration, initialValue: 'x + 1' }], 'VARIABLE_NOT_DECLARED'],
    [[declaration, { kind: 'assignment', target: 'x', expression: '4 / 2' }], 'TYPE_MISMATCH'],
    [[{ ...declaration, initialValue: '"5"' }], 'TYPE_MISMATCH'],
    [[{ kind: 'input', target: 'x', prompt: '' }], 'VARIABLE_NOT_DECLARED'],
    [[{ kind: 'output', mode: 'expression', text: 'true OR 1' }], 'TYPE_MISMATCH'],
    [[{ kind: 'output', mode: 'expression', text: 'unknown(1)' }], 'INVALID_EXPRESSION'],
  ] as const)('rejects an invalid program (%s)', (source, code) => {
    const result = compileProgram(programFixture(source));
    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]).toMatchObject({ code, instructionId: expect.any(String) });
    expect(result).not.toHaveProperty('program');
  });
  it('blocks all execution when a later node is invalid', () => {
    const source = programFixture([{ kind: 'output', mode: 'text', text: 'not executed' }, { kind: 'assignment', target: 'x', expression: '1' }]);
    expect(compileProgram(source).ok).toBe(false);
  });
  it('validates the document boundary before compilation', () => {
    expect(compileProgram({ schemaVersion: 100 })).toMatchObject({ ok: false, diagnostics: [{ code: 'INVALID_DOCUMENT' }] });
  });
  it('supports initialization by assignment and prototype-like variable names using Map', () => {
    const runtime = machine([{ kind: 'declaration', name: 'constructor', dataType: 'Integer', initialValue: '' }, { kind: 'assignment', target: 'constructor', expression: '3' }, { kind: 'output', mode: 'expression', text: 'constructor' }]);
    expect(runtime.advance().output).toEqual(['3']);
  });
});
describe('runtime input and limits', () => {
  it('executes all five data types with documented widening and typed output', () => {
    const runtime = machine([
      { kind: 'declaration', name: 'jumlah', dataType: 'Integer', initialValue: '2' },
      { kind: 'declaration', name: 'harga', dataType: 'Real', initialValue: 'jumlah' },
      { kind: 'declaration', name: 'lulus', dataType: 'Boolean', initialValue: 'harga >= 2 AND NOT false' },
      { kind: 'declaration', name: 'huruf', dataType: 'Character', initialValue: "'A'" },
      { kind: 'declaration', name: 'teks', dataType: 'String', initialValue: 'huruf' },
      { kind: 'output', mode: 'expression', text: 'teks + ": " + lulus + " / " + harga' },
    ]);
    const state = runtime.advance();
    expect(state.status).toBe('finished');
    expect(state.output).toEqual(['A: true / 2']);
    expect(state.variables.map((variable) => variable.value?.type)).toEqual(['Integer', 'Real', 'Boolean', 'Character', 'String']);
  });
  it('waits without consuming extra steps and retries invalid input without events', () => {
    const compiled = compileProgram(fixtures[3]!.document);
    if (!compiled.ok) throw new Error('fixture');
    const runtime = new Interpreter(compiled.program);
    const waiting = runtime.advance();
    expect(waiting.status).toBe('waiting_for_input');
    expect(runtime.advance()).toEqual(waiting);
    expect(runtime.submitInput('abc')).toMatchObject({ code: 'INPUT_INVALID', context: { name: 'nilai', expected: 'Integer' } });
    expect(runtime.snapshot()).toEqual(waiting);
    expect(runtime.submitInput('80')).toBeNull();
    const finished = runtime.advance();
    expect(finished.output).toEqual(['Nilai: 80']);
    expect(finished.executionCount).toBe(3);
    expect(finished.events.find((event) => event.type === 'VARIABLE_UPDATE')).toMatchObject({ before: null, after: { type: 'Integer', value: 80 } });
  });
  it('handles consecutive input requests and stops while waiting', () => {
    const source: SourceInstruction[] = [{ kind: 'declaration', name: 'x', dataType: 'Integer', initialValue: '' }, { kind: 'input', target: 'x', prompt: 'first' }, { kind: 'input', target: 'x', prompt: 'second' }, { kind: 'output', mode: 'expression', text: 'x' }];
    const runtime = machine(source);
    expect(runtime.advance().inputRequest?.prompt).toBe('first');
    runtime.submitInput('2');
    expect(runtime.advance().inputRequest?.prompt).toBe('second');
    const stopped = runtime.stop();
    runtime.submitInput('3');
    expect(runtime.advance()).toEqual(stopped);
    expect(stopped.status).toBe('stopped');
    expect(stopped.inputRequest).toBeNull();
  });
  it('reports arithmetic failures at the exact instruction without executing the next node', () => {
    const runtime = machine([{ kind: 'output', mode: 'expression', text: '1 / 0' }, { kind: 'output', mode: 'text', text: 'never' }]);
    const state = runtime.advance();
    expect(state.status).toBe('error');
    expect(state.output).toEqual([]);
    expect(state.diagnostics[0]).toMatchObject({ code: 'DIVISION_BY_ZERO', instructionId: state.currentInstructionId });
  });
  it('bounds steps, output and retained event log', () => {
    const source: SourceInstruction[] = [{ kind: 'output', mode: 'text', text: 'A' }, { kind: 'output', mode: 'text', text: 'B' }];
    expect(machine(source, { maxSteps: 1 }).advance().diagnostics[0]?.code).toBe('STEP_LIMIT');
    expect(machine(source, { maxOutput: 1 }).advance().diagnostics[0]?.code).toBe('OUTPUT_LIMIT');
    const state = machine(source, { maxEvents: 2 }).advance();
    expect(state.events).toHaveLength(2);
    expect(state.events.at(-1)?.type).toBe('PROGRAM_FINISHED');
  });
  it('returns detached snapshots and does not mutate past events', () => {
    const runtime = machine([{ kind: 'declaration', name: 'x', dataType: 'Integer', initialValue: '1' }, { kind: 'assignment', target: 'x', expression: '2' }]);
    const before = runtime.advance(1);
    before.variables[0]!.value = null;
    const after = runtime.advance();
    expect(after.variables[0]?.value?.value).toBe(2);
    expect(after.events.find((event) => event.type === 'VARIABLE_DECLARE')).toMatchObject({ variable: { value: { type: 'Integer', value: 1 } } });
  });
  it.each([
    ['-5', 'Integer', -5], ['3.5', 'Real', 3.5], ['1e2', 'Real', 100],
    ['false', 'Boolean', false], ['  hello  ', 'String', '  hello  '], ['😀', 'Character', '😀'],
  ] as const)('parses %s as %s', (raw, type, expected) => expect(parseInput(raw, type).value).toBe(expected));
  it.each([
    ['', 'Integer'], ['1.2', 'Integer'], ['0x10', 'Integer'], ['1e2', 'Integer'],
    ['Infinity', 'Real'], ['NaN', 'Real'], ['1,2', 'Real'], ['yes', 'Boolean'], ['1', 'Boolean'],
    ['ab', 'Character'], ['9007199254740992', 'Integer'], ['1e999', 'Real'],
  ] as const)('rejects invalid %s for %s', (raw, type) => expect(() => parseInput(raw, type)).toThrow());
});
