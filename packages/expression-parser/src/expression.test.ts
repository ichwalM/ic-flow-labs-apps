import { describe, expect, it } from 'vitest';
import { assignValue, evaluate, inferType, LanguageError, parseExpression, type DiagnosticCode } from './index';

const value = (source: string) => evaluate(parseExpression(source), (name) => { throw new LanguageError('VARIABLE_NOT_DECLARED', { name }); });
function rejects(source: string, code: DiagnosticCode) {
  try { value(source); throw new Error('Expected rejection'); }
  catch (error) { expect(error).toBeInstanceOf(LanguageError); expect((error as LanguageError).code).toBe(code); }
}
describe('expression syntax and semantics', () => {
  it.each([
    ['2 + 3 * 4', 'Integer', 14], ['(2 + 3) * 4', 'Integer', 20],
    ['10 - 3 - 2', 'Integer', 5], ['2 ^ 3 ^ 2', 'Real', 512],
    ['-2 ^ 2', 'Real', -4], ['(-2) ^ 2', 'Real', 4], ['2 ^ -2', 'Real', 0.25],
    ['7 / 2', 'Real', 3.5], ['4 / 2', 'Real', 2], ['7 % 3', 'Integer', 1],
    ['1.5 + 2', 'Real', 3.5], ['1e2 + .5', 'Real', 100.5],
    ['NOT false AND true OR false', 'Boolean', true], ['1 < 2 AND 2 >= 2', 'Boolean', true],
    ['1 == 1.0', 'Boolean', true], ['"a" != "b"', 'Boolean', true],
    ['"Nilai: " + 75', 'String', 'Nilai: 75'], ['"Lulus: " + true', 'String', 'Lulus: true'],
    ["'A'", 'Character', 'A'], ["'😀'", 'Character', '😀'],
    ['"a\\n\\t\\"b"', 'String', 'a\n\t"b'],
  ])('%s has explicit type %s and expected value', (source, type, expected) => {
    expect(value(source)).toEqual({ type, value: expected });
    expect(inferType(parseExpression(source), () => 'Integer')).toBe(type);
  });
  it('short-circuits Boolean expressions without evaluating the other branch', () => {
    expect(value('false AND (1 / 0 > 0)').value).toBe(false);
    expect(value('true OR (1 / 0 > 0)').value).toBe(true);
  });
  it('resolves case-sensitive identifiers through an explicit environment', () => {
    const ast = parseExpression('harga * jumlah');
    expect(evaluate(ast, (name) => ({ type: 'Integer', value: name === 'harga' ? 10000 : 3 }))).toEqual({ type: 'Integer', value: 30000 });
    expect(parseExpression('nilai')).toMatchObject({ kind: 'identifier', name: 'nilai' });
  });
  it.each(['', '2 +', '(2', '2)', '"unclosed', '"bad\\q"', '1 2', '1e', 'foo(1)', 'a.b', 'a[0]', 'x = 1', '1;2', '{x:1}', 'true && false', '`text`'])('rejects unsupported grammar %s', (source) => rejects(source, 'INVALID_EXPRESSION'));
  it.each(['"10" - 2', 'true + 1', 'NOT 1', '1 AND true', '"2" > 1', '"1" == 1'])('does not coerce %s', (source) => rejects(source, 'TYPE_MISMATCH'));
  it('checks the type of both logical operands before execution', () => {
    expect(() => inferType(parseExpression('true OR 1'), () => 'Integer')).toThrow('TYPE_MISMATCH');
  });
  it.each(['1 / 0', '1 % 0'])('rejects zero denominator %s', (source) => rejects(source, 'DIVISION_BY_ZERO'));
  it.each(['9007199254740992', '9007199254740991 + 1', '1e309', '2 ^ 1024', '(-1) ^ 0.5'])('rejects nonfinite or unsafe integer %s', (source) => rejects(source, 'NUMBER_RANGE'));
  it.each(["''", "'ab'"])('requires one Unicode code point for Character %s', (source) => rejects(source, 'INVALID_CHARACTER'));
  it('bounds parser source length, nesting, and AST depth', () => {
    rejects(' '.repeat(2001), 'EXPRESSION_LIMIT');
    rejects('('.repeat(70) + '1' + ')'.repeat(70), 'EXPRESSION_LIMIT');
    rejects(Array(100).fill('1').join('+'), 'EXPRESSION_LIMIT');
    rejects(Array(300).fill('1').join('+'), 'EXPRESSION_LIMIT');
    rejects('-'.repeat(70) + '1', 'EXPRESSION_LIMIT');
  });
  it('bounds text produced by concatenation', () => {
    const ast = parseExpression('text + text');
    expect(() => evaluate(ast, () => ({ type: 'String', value: 'x'.repeat(6000) }))).toThrow('STRING_LIMIT');
  });
  it('allows only documented widening conversions', () => {
    expect(assignValue('Real', { type: 'Integer', value: 5 })).toEqual({ type: 'Real', value: 5 });
    expect(assignValue('String', { type: 'Character', value: 'A' })).toEqual({ type: 'String', value: 'A' });
    expect(() => assignValue('Integer', { type: 'Real', value: 5 })).toThrow('TYPE_MISMATCH');
    expect(() => assignValue('Character', { type: 'String', value: 'A' })).toThrow('TYPE_MISMATCH');
  });
});
