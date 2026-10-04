import { flowEdgeId, mergeId, type FlowBranch, type DataType } from '@flowlab/domain';
import { assignValue, diagnostic, displayValue, evaluate, LanguageError, type Diagnostic, type Expression, type Value } from '@flowlab/expression-parser';
import type { CompiledProgram, Statement } from './compile';
import { parseInput } from './input';

export interface Variable { name: string; dataType: DataType; value: Value | null }
export interface InputRequest { instructionId: string; target: string; dataType: DataType; prompt: string }
type EventPayload =
  | { type: 'CONDITION_EVALUATED'; instructionId: string; result: boolean; branch: FlowBranch }
  | { type: 'FLOW_TRAVERSED'; sourceId: string; targetId: string; branch?: FlowBranch }
  | { type: 'NODE_ENTER' | 'NODE_EXIT'; instructionId: string }
  | { type: 'VARIABLE_SCOPE_EXIT'; instructionId: string; names: string[] }
  | { type: 'VARIABLE_DECLARE'; instructionId: string; variable: Variable }
  | { type: 'VARIABLE_UPDATE'; instructionId: string; name: string; before: Value | null; after: Value }
  | { type: 'OUTPUT'; instructionId: string; text: string }
  | { type: 'INPUT_REQUEST'; instructionId: string; request: InputRequest }
  | { type: 'RUNTIME_ERROR'; instructionId?: string; diagnostic: Diagnostic }
  | { type: 'PROGRAM_FINISHED' | 'PROGRAM_STOPPED' };
export type ExecutionEvent = EventPayload & { sequence: number };
export type RuntimeStatus = 'idle' | 'running' | 'waiting_for_input' | 'finished' | 'error' | 'stopped';
export interface RuntimeSnapshot {
  status: RuntimeStatus;
  currentInstructionId: string | null;
  executionCount: number;
  variables: Variable[];
  output: string[];
  inputRequest: InputRequest | null;
  diagnostics: Diagnostic[];
  events: ExecutionEvent[];
  visitedNodeIds: string[];
  traversedEdgeIds: string[];
}
export const emptySnapshot = (): RuntimeSnapshot => ({ status: 'idle', currentInstructionId: null, executionCount: 0, variables: [], output: [], inputRequest: null, diagnostics: [], events: [], visitedNodeIds: [], traversedEdgeIds: [] });
export interface ExecutionLimits { maxSteps: number; maxOutput: number; maxEvents: number }
const defaults: ExecutionLimits = { maxSteps: 100000, maxOutput: 50000, maxEvents: 5000 };

export class Interpreter {
  private state = emptySnapshot();
  private variables = new Map<string, Variable>();
  private frames: { statements: Statement[]; index: number; merge?: string; loopId?: string; locals?: Set<string> }[];
  private forStates = new Map<string, { to: number; step: number }>();
  private visited = new Set<string>();
  private traversed = new Set<string>();
  private previousId: string;
  private pendingBranch?: FlowBranch;
  private outputLength = 0;
  private sequence = 0;
  private readonly program: CompiledProgram;
  private readonly limits: ExecutionLimits;
  constructor(program: CompiledProgram, limits: Partial<ExecutionLimits> = {}) {
    this.program = structuredClone(program);
    this.frames = [{ statements: this.program.statements, index: 0 }];
    this.previousId = program.startId;
    this.limits = { ...defaults, ...limits };
    for (const value of Object.values(this.limits)) if (!Number.isSafeInteger(value) || value < 1) throw new Error('INVALID_RUNTIME_LIMIT');
    this.state.status = 'running';
    this.emit({ type: 'NODE_ENTER', instructionId: program.startId });
    this.emit({ type: 'NODE_EXIT', instructionId: program.startId });
  }
  private emit(payload: EventPayload) {
    if (payload.type === 'NODE_ENTER') this.visited.add(payload.instructionId);
    if (payload.type === 'FLOW_TRAVERSED') {
      this.visited.add(payload.targetId);
      this.traversed.add(flowEdgeId(payload.sourceId, payload.targetId, payload.branch));
    }
    this.state.events.push(structuredClone({ ...payload, sequence: this.sequence++ }));
    if (this.state.events.length > this.limits.maxEvents) this.state.events.shift();
  }
  snapshot(): RuntimeSnapshot { return structuredClone({ ...this.state, variables: [...this.variables.values()], visitedNodeIds: [...this.visited], traversedEdgeIds: [...this.traversed] }); }
  private variable(name: string): Variable {
    const variable = this.variables.get(name);
    if (!variable) throw new LanguageError('VARIABLE_NOT_DECLARED', { name });
    return variable;
  }
  private resolve = (name: string): Value => {
    const value = this.variable(name).value;
    if (!value) throw new LanguageError('VARIABLE_UNINITIALIZED', { name });
    return value;
  };
  private update(name: string, value: Value, instructionId: string) {
    const variable = this.variable(name);
    const after = assignValue(variable.dataType, value);
    this.emit({ type: 'VARIABLE_UPDATE', instructionId, name, before: variable.value, after });
    variable.value = after;
  }
  private traverse(targetId: string) {
    this.emit({ type: 'FLOW_TRAVERSED', sourceId: this.previousId, targetId, branch: this.pendingBranch });
    this.previousId = targetId;
    this.pendingBranch = undefined;
  }
  private next(): Statement | undefined {
    while (this.frames.length) {
      const frame = this.frames.at(-1)!;
      if (frame.index < frame.statements.length) return frame.statements[frame.index];
      this.frames.pop();
      if (frame.merge) this.traverse(frame.merge);
      if (frame.loopId && frame.locals?.size) {
        const names = [...frame.locals];
        for (const name of names) this.variables.delete(name);
        this.emit({ type: 'VARIABLE_SCOPE_EXIT', instructionId: frame.loopId, names });
      }
    }
  }
  advance(budget = 32): RuntimeSnapshot {
    if (!Number.isSafeInteger(budget) || budget < 1) throw new Error('INVALID_BATCH_SIZE');
    // A caller cannot accidentally turn one browser tick into an unbounded run.
    const batch = Math.min(budget, 128);
    for (let n = 0; n < batch && this.state.status === 'running'; n++) {
      const instruction = this.next();
      if (!instruction) { this.finish(); break; }
      const frame = this.frames.at(-1)!;
      this.state.currentInstructionId = instruction.id;
      try {
        let advanceIndex = true;
        if (this.state.executionCount >= this.limits.maxSteps) throw new LanguageError('STEP_LIMIT', { limit: this.limits.maxSteps });
        this.state.executionCount++;
        this.traverse(instruction.id);
        this.emit({ type: 'NODE_ENTER', instructionId: instruction.id });
        switch (instruction.kind) {
          case 'decision': {
            const value = evaluate(instruction.condition, this.resolve);
            if (value.type !== 'Boolean') throw new LanguageError('TYPE_MISMATCH', { expected: 'Boolean', actual: value.type });
            const branch: FlowBranch = value.value ? 'consequent' : 'alternate';
            this.emit({ type: 'CONDITION_EVALUATED', instructionId: instruction.id, result: value.value, branch });
            this.pendingBranch = branch;
            this.frames.push({ statements: instruction[branch], index: 0, merge: mergeId(instruction.id) });
            break;
          }
          case 'while':
          case 'for': {
            let result: boolean;
            if (instruction.kind === 'while') {
              const value = evaluate(instruction.condition, this.resolve);
              if (value.type !== 'Boolean') throw new LanguageError('TYPE_MISMATCH', { expected: 'Boolean', actual: value.type });
              result = value.value;
            } else {
              let range = this.forStates.get(instruction.id);
              if (!range) {
                const integer = (expression: Expression) => {
                  const value = assignValue('Integer', evaluate(expression, this.resolve));
                  return value.value as number;
                };
                const from = integer(instruction.from), to = integer(instruction.to), step = integer(instruction.step);
                if (step === 0) throw new LanguageError('FOR_STEP_ZERO');
                range = { to, step };
                this.forStates.set(instruction.id, range);
                this.update(instruction.counter, { type: 'Integer', value: from }, instruction.id);
              } else {
                const current = this.resolve(instruction.counter).value as number;
                this.update(instruction.counter, { type: 'Integer', value: current + range.step }, instruction.id);
              }
              const current = this.resolve(instruction.counter).value as number;
              result = range.step > 0 ? current <= range.to : current >= range.to;
              if (!result) this.forStates.delete(instruction.id);
            }
            const branch: FlowBranch = result ? 'body' : 'exit';
            this.emit({ type: 'CONDITION_EVALUATED', instructionId: instruction.id, result, branch });
            this.pendingBranch = branch;
            if (result) {
              advanceIndex = false;
              this.frames.push({ statements: instruction.body, index: 0, loopId: instruction.id, locals: new Set() });
            } else this.traverse(mergeId(instruction.id));
            break;
          }
          case 'declaration': {
            if (this.variables.has(instruction.name)) throw new LanguageError('DUPLICATE_VARIABLE', { name: instruction.name });
            const value = instruction.initial ? assignValue(instruction.dataType, evaluate(instruction.initial, this.resolve)) : null;
            const variable = { name: instruction.name, dataType: instruction.dataType, value };
            this.variables.set(instruction.name, variable);
            [...this.frames].reverse().find(frame => frame.loopId)?.locals?.add(instruction.name);
            this.emit({ type: 'VARIABLE_DECLARE', instructionId: instruction.id, variable });
            break;
          }
          case 'assignment': this.update(instruction.target, evaluate(instruction.expression, this.resolve), instruction.id); break;
          case 'output': {
            const text = displayValue(evaluate(instruction.expression, this.resolve));
            if (this.outputLength + text.length + 1 > this.limits.maxOutput) throw new LanguageError('OUTPUT_LIMIT', { limit: this.limits.maxOutput });
            this.outputLength += text.length + 1;
            this.state.output.push(text);
            this.emit({ type: 'OUTPUT', instructionId: instruction.id, text });
            break;
          }
          case 'input': {
            const request = { instructionId: instruction.id, target: instruction.target, dataType: this.variable(instruction.target).dataType, prompt: instruction.prompt };
            this.state.inputRequest = request;
            this.state.status = 'waiting_for_input';
            this.emit({ type: 'INPUT_REQUEST', instructionId: instruction.id, request });
            return this.snapshot();
          }
        }
        this.emit({ type: 'NODE_EXIT', instructionId: instruction.id });
        if (advanceIndex) frame.index++;
      } catch (error) {
        const problem = diagnostic(error, instruction.id);
        this.state.status = 'error';
        this.state.diagnostics.push(problem);
        this.emit({ type: 'RUNTIME_ERROR', instructionId: instruction.id, diagnostic: problem });
      }
    }
    if (this.state.status === 'running' && !this.next()) this.finish();
    return this.snapshot();
  }
  submitInput(raw: string): Diagnostic | null {
    const request = this.state.inputRequest;
    if (this.state.status !== 'waiting_for_input' || !request) return null;
    try {
      const value = parseInput(raw, request.dataType);
      this.update(request.target, value, request.instructionId);
      this.emit({ type: 'NODE_EXIT', instructionId: request.instructionId });
      this.frames.at(-1)!.index++;
      this.state.inputRequest = null;
      this.state.status = 'running';
      return null;
    } catch (error) {
      const problem = diagnostic(error, request.instructionId);
      problem.context = { ...problem.context, name: request.target, expected: request.dataType };
      return problem;
    }
  }
  stop(): RuntimeSnapshot {
    if (this.state.status === 'running' || this.state.status === 'waiting_for_input') {
      this.state.status = 'stopped';
      this.state.inputRequest = null;
      this.emit({ type: 'PROGRAM_STOPPED' });
    }
    return this.snapshot();
  }
  private finish() {
    this.traverse(this.program.endId);
    this.state.currentInstructionId = this.program.endId;
    this.state.status = 'finished';
    this.emit({ type: 'NODE_ENTER', instructionId: this.program.endId });
    this.emit({ type: 'NODE_EXIT', instructionId: this.program.endId });
    this.emit({ type: 'PROGRAM_FINISHED' });
  }
}
