import { z } from 'zod';
import { dataTypes, flattenInstructions, MAX_BRANCH_DEPTH, MAX_INSTRUCTIONS, VARIABLE_NAME, type Instruction, type ProjectDocument } from '@flowlab/domain';

const id = z.string().uuid();
const text = z.string().max(2000);
const name = z.string().max(64).regex(VARIABLE_NAME);
const basicInstructions = [
  z.strictObject({ id, kind: z.literal('declaration'), name, dataType: z.enum(dataTypes), initialValue: text }),
  z.strictObject({ id, kind: z.literal('assignment'), target: name, expression: text.min(1) }),
  z.strictObject({ id, kind: z.literal('input'), target: name, prompt: text }),
 ] as const;
const output = z.strictObject({ id, kind: z.literal('output'), mode: z.enum(['text', 'expression']), text: text.min(1) });
const recursiveInstruction: z.ZodType<Instruction> = z.lazy(() => z.discriminatedUnion('kind', [
  ...basicInstructions,
  output,
  z.strictObject({ id, kind: z.literal('decision'), condition: text.min(1), consequent: z.array(recursiveInstruction), alternate: z.array(recursiveInstruction) }),
  z.strictObject({ id, kind: z.literal('while'), condition: text.min(1), body: z.array(recursiveInstruction) }),
  z.strictObject({ id, kind: z.literal('for'), counter: name, from: text.min(1), to: text.min(1), step: text.min(1), body: z.array(recursiveInstruction) }),
]));
function boundedTree(block: unknown): boolean {
  if (!Array.isArray(block) || block.length > MAX_INSTRUCTIONS) return false;
  const pending = block.map(value => ({ value, depth: 0 }));
  const seen = new Set<object>();
  let count = 0;
  while (pending.length) {
    const { value, depth } = pending.pop()!;
    if (!value || typeof value !== 'object' || seen.has(value) || ++count > MAX_INSTRUCTIONS) return false;
    seen.add(value);
    if (value.kind === 'decision' || value.kind === 'while' || value.kind === 'for') {
      if (depth >= MAX_BRANCH_DEPTH) return false;
      for (const children of value.kind === 'decision' ? [value.consequent, value.alternate] : [value.body]) {
        if (!Array.isArray(children) || children.length > MAX_INSTRUCTIONS) return false;
        pending.push(...children.map(value => ({ value, depth: depth + 1 })));
      }
    }
  }
  return true;
}
export const instructionSchema = z.unknown().refine(value => boundedTree([value]), 'BRANCH_OR_INSTRUCTION_LIMIT').pipe(recursiveInstruction);
const metadata = z.strictObject({ id, title: z.string().trim().min(1).max(100) });
const layout = z.strictObject({ positions: z.record(id, z.strictObject({ x: z.number().min(-100000).max(100000), y: z.number().min(-100000).max(100000) })) });
const rawProjectSchema = z.strictObject({
  schemaVersion: z.literal(4), metadata,
  program: z.strictObject({ startId: id, endId: id, instructions: z.array(recursiveInstruction) }),
  layout,
}).superRefine((doc, ctx) => {
  const ids = [doc.program.startId, doc.program.endId, ...flattenInstructions(doc.program.instructions).map((i) => i.id)];
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: 'custom', message: 'DUPLICATE_ID' });
  if (Object.keys(doc.layout.positions).some((key) => !ids.includes(key))) ctx.addIssue({ code: 'custom', message: 'ORPHAN_POSITION' });
});
const projectGuard = z.unknown().refine(value => {
  if (!value || typeof value !== 'object' || !('program' in value)) return false;
  const program = value.program;
  return !!program && typeof program === 'object' && 'instructions' in program && boundedTree(program.instructions);
}, 'BRANCH_OR_INSTRUCTION_LIMIT');
export const projectSchema = projectGuard.pipe(rawProjectSchema);
export const MAX_FILE_BYTES = 1_000_000;
const legacySchema = z.strictObject({
  schemaVersion: z.literal(1),
  metadata, layout,
  program: z.strictObject({ startId: id, endId: id, instructions: z.array(z.discriminatedUnion('kind', [
    ...basicInstructions, z.strictObject({ id, kind: z.literal('output'), text: text.min(1) }),
  ])).max(MAX_INSTRUCTIONS) }),
});
const legacyV2Schema = z.strictObject({ schemaVersion: z.literal(2), metadata, layout,
  program: z.strictObject({ startId: id, endId: id, instructions: z.array(z.discriminatedUnion('kind', [...basicInstructions, output])).max(MAX_INSTRUCTIONS) }),
});
const legacyV3Instruction: z.ZodType<Instruction> = z.lazy(() => z.discriminatedUnion('kind', [
  ...basicInstructions, output,
  z.strictObject({ id, kind: z.literal('decision'), condition: text.min(1), consequent: z.array(legacyV3Instruction), alternate: z.array(legacyV3Instruction) }),
]));
const legacyV3Schema = projectGuard.pipe(z.strictObject({ schemaVersion: z.literal(3), metadata,
  program: z.strictObject({ startId: id, endId: id, instructions: z.array(legacyV3Instruction) }), layout,
}));
export function migrateDocument(source: unknown): ProjectDocument {
  if (typeof source === 'object' && source !== null && 'schemaVersion' in source && source.schemaVersion === 1) {
    const legacy = legacySchema.parse(source);
    return projectSchema.parse({ ...legacy, schemaVersion: 4, program: { ...legacy.program, instructions: legacy.program.instructions.map((i) => i.kind === 'output' ? { ...i, mode: 'text' } : i) } });
  }
  if (typeof source === 'object' && source !== null && 'schemaVersion' in source && source.schemaVersion === 2) return projectSchema.parse({ ...legacyV2Schema.parse(source), schemaVersion: 4 });
  if (typeof source === 'object' && source !== null && 'schemaVersion' in source && source.schemaVersion === 3) return projectSchema.parse({ ...legacyV3Schema.parse(source), schemaVersion: 4 });
  return projectSchema.parse(source);
}
export function parseDocument(source: string): ProjectDocument {
  if (new TextEncoder().encode(source).length > MAX_FILE_BYTES) throw new Error('FILE_TOO_LARGE');
  return migrateDocument(JSON.parse(source));
}
