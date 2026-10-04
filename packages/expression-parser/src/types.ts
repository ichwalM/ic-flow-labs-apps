import type { DataType } from '@flowlab/domain';

export type Value =
  | { type: 'Integer' | 'Real'; value: number }
  | { type: 'Boolean'; value: boolean }
  | { type: 'String' | 'Character'; value: string };
export type UnaryOperator = '+' | '-' | 'NOT';
export type BinaryOperator = '+' | '-' | '*' | '/' | '%' | '^' | '==' | '!=' | '>' | '>=' | '<' | '<=' | 'AND' | 'OR';
export type Expression =
  | { kind: 'literal'; literal: Value; position: number }
  | { kind: 'identifier'; name: string; position: number }
  | { kind: 'unary'; operator: UnaryOperator; argument: Expression; position: number }
  | { kind: 'binary'; operator: BinaryOperator; left: Expression; right: Expression; position: number };
export const limits = { source: 2000, tokens: 512, depth: 64, string: 10000 } as const;
export const reservedName = /^(AND|OR|NOT|TRUE|FALSE)$/i;
export type DiagnosticCode =
  | 'INVALID_DOCUMENT' | 'INVALID_EXPRESSION' | 'EXPRESSION_LIMIT' | 'TYPE_MISMATCH'
  | 'VARIABLE_NOT_DECLARED' | 'VARIABLE_NOT_ALWAYS_DECLARED' | 'VARIABLE_UNINITIALIZED' | 'DUPLICATE_VARIABLE' | 'RESERVED_NAME'
  | 'DIVISION_BY_ZERO' | 'NUMBER_RANGE' | 'STRING_LIMIT' | 'INVALID_CHARACTER'
  | 'FOR_STEP_ZERO' | 'FOR_COUNTER_READONLY'
  | 'INPUT_INVALID' | 'STEP_LIMIT' | 'OUTPUT_LIMIT' | 'INTERNAL_ERROR';
export interface Diagnostic {
  code: DiagnosticCode;
  severity: 'error';
  instructionId?: string;
  position?: number;
  context: Record<string, string | number>;
}
export class LanguageError extends Error {
  constructor(public readonly code: DiagnosticCode, public readonly context: Record<string, string | number> = {}, public readonly position?: number) {
    super(code);
    this.name = 'LanguageError';
  }
}
export function diagnostic(error: unknown, instructionId?: string): Diagnostic {
  return error instanceof LanguageError
    ? { code: error.code, severity: 'error', instructionId, position: error.position, context: error.context }
    : { code: 'INTERNAL_ERROR', severity: 'error', instructionId, context: {} };
}
export const isNumericType = (type: DataType) => type === 'Integer' || type === 'Real';
export const isTextType = (type: DataType) => type === 'String' || type === 'Character';
export function checked(value: Value): Value {
  if (typeof value.value === 'number' && (!Number.isFinite(value.value) || (value.type === 'Integer' && !Number.isSafeInteger(value.value)))) throw new LanguageError('NUMBER_RANGE');
  if (typeof value.value === 'string' && value.value.length > limits.string) throw new LanguageError('STRING_LIMIT');
  if (value.type === 'Character' && [...value.value].length !== 1) throw new LanguageError('INVALID_CHARACTER');
  return value;
}
