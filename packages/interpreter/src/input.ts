import type { DataType } from '@flowlab/domain';
import { checked, LanguageError, limits, type Value } from '@flowlab/expression-parser';

export function parseInput(raw: string, type: DataType): Value {
  if (raw.length > limits.string) throw new LanguageError('STRING_LIMIT');
  const trimmed = raw.trim();
  if (type === 'String' || type === 'Character') return checked({ type, value: raw });
  if (type === 'Boolean' && /^(true|false)$/i.test(trimmed)) return { type, value: trimmed.toLowerCase() === 'true' };
  if (type === 'Integer' && /^[+-]?\d+$/.test(trimmed)) return checked({ type, value: Number(trimmed) });
  if (type === 'Real' && /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(trimmed)) return checked({ type, value: Number(trimmed) });
  throw new LanguageError('INPUT_INVALID', { expected: type });
}
