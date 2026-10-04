import { checked, LanguageError, limits, type BinaryOperator, type Expression, type Value } from './types';

type Token = { kind: 'literal'; value: Value; position: number } | { kind: 'identifier' | 'operator' | 'eof'; text: string; position: number };
function tokenize(source: string): Token[] {
  if (source.length > limits.source) throw new LanguageError('EXPRESSION_LIMIT');
  const tokens: Token[] = [];
  let cursor = 0;
  while (cursor < source.length) {
    if (/\s/.test(source[cursor]!)) { cursor++; continue; }
    if (tokens.length >= limits.tokens) throw new LanguageError('EXPRESSION_LIMIT');
    const position = cursor;
    const char = source[cursor]!;
    if (char === '"' || char === "'") {
      const quote = char;
      let value = '', closed = false;
      cursor++;
      while (cursor < source.length) {
        const current = source[cursor++]!;
        if (current === quote) { closed = true; break; }
        if (current === '\\') {
          const escape = source[cursor++];
          const escapes: Record<string, string> = { n: '\n', r: '\r', t: '\t', '\\': '\\', '"': '"', "'": "'" };
          if (!escape || !Object.hasOwn(escapes, escape)) throw new LanguageError('INVALID_EXPRESSION', {}, position);
          value += escapes[escape];
        } else value += current;
      }
      if (!closed) throw new LanguageError('INVALID_EXPRESSION', {}, position);
      tokens.push({ kind: 'literal', value: checked({ type: quote === "'" ? 'Character' : 'String', value }), position });
      continue;
    }
    const number = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(source.slice(cursor));
    if (number) {
      const raw = number[0];
      tokens.push({ kind: 'literal', value: checked({ type: /[.eE]/.test(raw) ? 'Real' : 'Integer', value: Number(raw) }), position });
      cursor += raw.length; continue;
    }
    const word = /^[A-Za-z_][A-Za-z0-9_]*/.exec(source.slice(cursor));
    if (word) {
      const text = word[0], upper = text.toUpperCase();
      if (upper === 'TRUE' || upper === 'FALSE') tokens.push({ kind: 'literal', value: { type: 'Boolean', value: upper === 'TRUE' }, position });
      else tokens.push({ kind: ['AND', 'OR', 'NOT'].includes(upper) ? 'operator' : 'identifier', text: ['AND', 'OR', 'NOT'].includes(upper) ? upper : text, position });
      cursor += text.length; continue;
    }
    const operator = /^(==|!=|>=|<=|[+\-*/%^><()])/.exec(source.slice(cursor));
    if (!operator) throw new LanguageError('INVALID_EXPRESSION', {}, position);
    tokens.push({ kind: 'operator', text: operator[0], position });
    cursor += operator[0].length;
  }
  tokens.push({ kind: 'eof', text: '', position: cursor });
  return tokens;
}
const precedence: Record<BinaryOperator, number> = { OR: 1, AND: 2, '==': 3, '!=': 3, '>': 4, '>=': 4, '<': 4, '<=': 4, '+': 5, '-': 5, '*': 6, '/': 6, '%': 6, '^': 8 };
export function parseExpression(source: string): Expression {
  const tokens = tokenize(source);
  let cursor = 0;
  const peek = () => tokens[cursor]!;
  function parse(minimum = 0, depth = 0): Expression {
    if (depth >= limits.depth) throw new LanguageError('EXPRESSION_LIMIT');
    const token = tokens[cursor++]!;
    let left: Expression;
    if (token.kind === 'literal') left = { kind: 'literal', literal: token.value, position: token.position };
    else if (token.kind === 'identifier') left = { kind: 'identifier', name: token.text, position: token.position };
    else if (token.kind === 'operator' && ['+', '-', 'NOT'].includes(token.text)) {
      left = { kind: 'unary', operator: token.text as '+' | '-' | 'NOT', argument: parse(7, depth + 1), position: token.position };
    } else if (token.kind === 'operator' && token.text === '(') {
      left = parse(0, depth + 1);
      const close = tokens[cursor++];
      if (close?.kind !== 'operator' || close.text !== ')') throw new LanguageError('INVALID_EXPRESSION', {}, token.position);
    } else throw new LanguageError('INVALID_EXPRESSION', {}, token.position);
    while (peek()?.kind === 'operator') {
      const next = peek();
      if (next.kind !== 'operator' || !Object.hasOwn(precedence, next.text)) break;
      const operator = next.text as BinaryOperator, level = precedence[operator];
      if (level < minimum) break;
      cursor++;
      const right = parse(operator === '^' ? level : level + 1, depth + 1);
      left = { kind: 'binary', operator, left, right, position: next.position };
    }
    return left;
  }
  const expression = parse();
  if (peek()?.kind !== 'eof') throw new LanguageError('INVALID_EXPRESSION', {}, peek()?.position);
  function checkDepth(node: Expression, depth = 0): void {
    if (depth >= limits.depth) throw new LanguageError('EXPRESSION_LIMIT');
    if (node.kind === 'unary') checkDepth(node.argument, depth + 1);
    if (node.kind === 'binary') { checkDepth(node.left, depth + 1); checkDepth(node.right, depth + 1); }
  }
  checkDepth(expression);
  return expression;
}
