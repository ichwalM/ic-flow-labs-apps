import type { DataType, Instruction } from '@flowlab/domain';
import { projectSchema } from '@flowlab/flow-schema';
import { assertAssignable, diagnostic, inferType, LanguageError, parseExpression, reservedName, type Diagnostic, type Expression } from '@flowlab/expression-parser';

export type Statement =
  | { kind: 'declaration'; id: string; name: string; dataType: DataType; initial?: Expression }
  | { kind: 'assignment'; id: string; target: string; expression: Expression }
  | Extract<Instruction, { kind: 'input' }>
  | { kind: 'output'; id: string; expression: Expression }
  | { kind: 'decision'; id: string; condition: Expression; consequent: Statement[]; alternate: Statement[] }
  | { kind: 'while'; id: string; condition: Expression; body: Statement[] }
  | { kind: 'for'; id: string; counter: string; from: Expression; to: Expression; step: Expression; body: Statement[] };
export interface CompiledProgram { startId: string; endId: string; statements: Statement[] }
export type CompileResult = { ok: true; program: CompiledProgram; diagnostics: [] } | { ok: false; diagnostics: Diagnostic[] };
type Symbol = { type: DataType; initialized: boolean; declared: boolean };
const cloneSymbols = (symbols: Map<string, Symbol>) => new Map([...symbols].map(([name, symbol]) => [name, { ...symbol }]));

export function compileProgram(source: unknown): CompileResult {
  const parsed = projectSchema.safeParse(source);
  if (!parsed.success) return { ok: false, diagnostics: [{ code: 'INVALID_DOCUMENT', severity: 'error', context: {} }] };
  const document = parsed.data;
  const diagnostics: Diagnostic[] = [];
  function compileBlock(block: Instruction[], symbols: Map<string, Symbol>, counters: ReadonlySet<string> = new Set()): Statement[] {
    const statements: Statement[] = [];
    function lookup(name: string, reading = false) {
      const symbol = symbols.get(name);
      if (!symbol) throw new LanguageError('VARIABLE_NOT_DECLARED', { name });
      if (!symbol.declared) throw new LanguageError('VARIABLE_NOT_ALWAYS_DECLARED', { name });
      if (reading && !symbol.initialized) throw new LanguageError('VARIABLE_UNINITIALIZED', { name });
      return symbol;
    }
    function writable(name: string) {
      if (counters.has(name)) throw new LanguageError('FOR_COUNTER_READONLY', { name });
      return lookup(name);
    }
    function expression(source: string) {
      const ast = parseExpression(source);
      return { ast, type: inferType(ast, name => lookup(name, true).type) };
    }
    for (const instruction of block) {
      try {
        switch (instruction.kind) {
          case 'declaration': {
            if (reservedName.test(instruction.name)) throw new LanguageError('RESERVED_NAME', { name: instruction.name });
            if (symbols.has(instruction.name)) throw new LanguageError('DUPLICATE_VARIABLE', { name: instruction.name });
            const initial = instruction.initialValue.trim() ? expression(instruction.initialValue) : undefined;
            if (initial) assertAssignable(instruction.dataType, initial.type);
            symbols.set(instruction.name, { type: instruction.dataType, initialized: !!initial, declared: true });
            statements.push({ kind: 'declaration', id: instruction.id, name: instruction.name, dataType: instruction.dataType, initial: initial?.ast });
            break;
          }
          case 'decision': {
            const condition = expression(instruction.condition);
            assertAssignable('Boolean', condition.type);
            const yes = cloneSymbols(symbols), no = cloneSymbols(symbols);
            const consequent = compileBlock(instruction.consequent, yes, counters);
            const alternate = compileBlock(instruction.alternate, no, counters);
            for (const name of new Set([...yes.keys(), ...no.keys()])) {
              const a = yes.get(name), b = no.get(name);
              if (a && b && a.type !== b.type) throw new LanguageError('TYPE_MISMATCH', { expected: a.type, actual: b.type });
              symbols.set(name, { type: (a ?? b)!.type, declared: !!a?.declared && !!b?.declared, initialized: !!a?.initialized && !!b?.initialized });
            }
            statements.push({ kind: 'decision', id: instruction.id, condition: condition.ast, consequent, alternate });
            break;
          }
          case 'while': {
            const condition = expression(instruction.condition);
            assertAssignable('Boolean', condition.type);
            const body = compileBlock(instruction.body, cloneSymbols(symbols), counters);
            statements.push({ kind: 'while', id: instruction.id, condition: condition.ast, body });
            break;
          }
          case 'for': {
            const counter = writable(instruction.counter);
            assertAssignable('Integer', counter.type);
            const from = expression(instruction.from), to = expression(instruction.to), step = expression(instruction.step);
            for (const value of [from, to, step]) assertAssignable('Integer', value.type);
            // Bounds are read before initialization; the counter is initialized even for an empty range.
            counter.initialized = true;
            const body = compileBlock(instruction.body, cloneSymbols(symbols), new Set([...counters, instruction.counter]));
            statements.push({ kind: 'for', id: instruction.id, counter: instruction.counter, from: from.ast, to: to.ast, step: step.ast, body });
            break;
          }
          case 'assignment': {
            const symbol = writable(instruction.target);
            const value = expression(instruction.expression);
            assertAssignable(symbol.type, value.type);
            symbol.initialized = true;
            statements.push({ kind: 'assignment', id: instruction.id, target: instruction.target, expression: value.ast });
            break;
          }
          case 'input':
            writable(instruction.target).initialized = true;
            statements.push(instruction);
            break;
          case 'output': {
            const ast: Expression = instruction.mode === 'text'
              ? { kind: 'literal', literal: { type: 'String', value: instruction.text }, position: 0 }
              : expression(instruction.text).ast;
            statements.push({ kind: 'output', id: instruction.id, expression: ast });
            break;
          }
        }
      } catch (error) { diagnostics.push(diagnostic(error, instruction.id)); }
    }
    return statements;
  }
  const statements = compileBlock(document.program.instructions, new Map());
  return diagnostics.length ? { ok: false, diagnostics } : { ok: true, diagnostics: [], program: { startId: document.program.startId, endId: document.program.endId, statements } };
}
