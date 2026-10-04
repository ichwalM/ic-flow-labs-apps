import type { DataType } from '@flowlab/domain';
import { checked, isNumericType, isTextType, LanguageError, limits, type BinaryOperator, type Expression, type Value } from './types';

function mismatch(expected: string, actual: string): never { throw new LanguageError('TYPE_MISMATCH', { expected, actual }); }
function binaryType(operator: BinaryOperator, left: DataType, right: DataType): DataType {
  if (operator === 'AND' || operator === 'OR') {
    if (left !== 'Boolean' || right !== 'Boolean') mismatch('Boolean', `${left}, ${right}`);
    return 'Boolean';
  }
  if (operator === '==' || operator === '!=') {
    if (left !== right && !(isNumericType(left) && isNumericType(right)) && !(isTextType(left) && isTextType(right))) mismatch(left, right);
    return 'Boolean';
  }
  if (operator === '+' && (isTextType(left) || isTextType(right))) return 'String';
  if (!isNumericType(left) || !isNumericType(right)) mismatch('Integer / Real', `${left}, ${right}`);
  if (['>', '>=', '<', '<='].includes(operator)) return 'Boolean';
  if (operator === '/' || operator === '^' || left === 'Real' || right === 'Real') return 'Real';
  return 'Integer';
}
export function inferType(node: Expression, resolve: (name: string) => DataType, depth = 0): DataType {
  if (depth >= limits.depth) throw new LanguageError('EXPRESSION_LIMIT');
  if (node.kind === 'literal') return checked(node.literal).type;
  if (node.kind === 'identifier') return resolve(node.name);
  if (node.kind === 'unary') {
    const type = inferType(node.argument, resolve, depth + 1);
    if (node.operator === 'NOT') { if (type !== 'Boolean') mismatch('Boolean', type); return 'Boolean'; }
    if (!isNumericType(type)) mismatch('Integer / Real', type);
    return type;
  }
  return binaryType(node.operator, inferType(node.left, resolve, depth + 1), inferType(node.right, resolve, depth + 1));
}
export function displayValue(value: Value): string { return String(value.value); }
export function assertAssignable(expected: DataType, actual: DataType): void {
  if (expected !== actual && !(expected === 'Real' && actual === 'Integer') && !(expected === 'String' && actual === 'Character')) mismatch(expected, actual);
}
export function assignValue(expected: DataType, value: Value): Value {
  assertAssignable(expected, value.type);
  if (expected === 'Real' && value.type === 'Integer') return checked({ type: 'Real', value: value.value });
  if (expected === 'String' && value.type === 'Character') return checked({ type: 'String', value: value.value });
  return checked(value);
}
export function evaluate(node: Expression, resolve: (name: string) => Value, depth = 0): Value {
  if (depth >= limits.depth) throw new LanguageError('EXPRESSION_LIMIT');
  if (node.kind === 'literal') return checked({ ...node.literal });
  if (node.kind === 'identifier') return checked(resolve(node.name));
  if (node.kind === 'unary') {
    const value = evaluate(node.argument, resolve, depth + 1);
    if (node.operator === 'NOT') {
      if (value.type !== 'Boolean') mismatch('Boolean', value.type);
      return { type: 'Boolean', value: !value.value };
    }
    if (value.type !== 'Integer' && value.type !== 'Real') mismatch('Integer / Real', value.type);
    return checked({ type: value.type, value: node.operator === '-' ? -value.value : value.value });
  }
  const left = evaluate(node.left, resolve, depth + 1);
  if (node.operator === 'AND' || node.operator === 'OR') {
    if (left.type !== 'Boolean') mismatch('Boolean', left.type);
    if (node.operator === 'AND' && !left.value) return { type: 'Boolean', value: false };
    if (node.operator === 'OR' && left.value) return { type: 'Boolean', value: true };
  }
  const right = evaluate(node.right, resolve, depth + 1);
  const resultType = binaryType(node.operator, left.type, right.type);
  if (resultType === 'String') return checked({ type: 'String', value: displayValue(left) + displayValue(right) });
  if (node.operator === '==') return { type: 'Boolean', value: left.value === right.value };
  if (node.operator === '!=') return { type: 'Boolean', value: left.value !== right.value };
  if (node.operator === 'AND' || node.operator === 'OR') return { type: 'Boolean', value: right.value as boolean };
  const a = left.value as number, b = right.value as number;
  if (node.operator === '>') return { type: 'Boolean', value: a > b };
  if (node.operator === '>=') return { type: 'Boolean', value: a >= b };
  if (node.operator === '<') return { type: 'Boolean', value: a < b };
  if (node.operator === '<=') return { type: 'Boolean', value: a <= b };
  if ((node.operator === '/' || node.operator === '%') && b === 0) throw new LanguageError('DIVISION_BY_ZERO');
  let value: number;
  switch (node.operator) {
    case '+': value = a + b; break;
    case '-': value = a - b; break;
    case '*': value = a * b; break;
    case '/': value = a / b; break;
    case '%': value = a % b; break;
    case '^': value = a ** b; break;
  }
  return checked({ type: resultType as 'Integer' | 'Real', value });
}
