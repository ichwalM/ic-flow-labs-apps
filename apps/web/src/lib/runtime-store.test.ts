import { beforeEach, describe, expect, it } from 'vitest';
import { createDocument, insertInstruction, moveInstruction } from '@flowlab/domain';
import { useEditor } from './editor-store';
import { useRuntime } from './runtime-store';

beforeEach(() => { useEditor.getState().hydrate(createDocument()); useRuntime.getState().reset(); });
describe('editor and runtime ownership', () => {
  it('does not put execution into undo history and ignores layout or title edits', () => {
    const editor = useEditor.getState();
    const doc = insertInstruction(editor.history.present, editor.history.present.program.startId, { id: crypto.randomUUID(), kind: 'output', mode: 'text', text: 'Halo' });
    editor.change(doc);
    const past = useEditor.getState().history.past;
    useRuntime.getState().run(doc);
    useRuntime.getState().tick();
    const snapshot = useRuntime.getState().snapshot;
    expect(snapshot.output).toEqual(['Halo']);
    expect(useEditor.getState().history.past).toBe(past);
    useEditor.getState().change(moveInstruction(doc, doc.program.startId, { x: 50, y: 20 }));
    expect(useRuntime.getState().snapshot).toBe(snapshot);
    const current = useEditor.getState().history.present;
    useEditor.getState().change({ ...current, metadata: { ...current.metadata, title: 'Renamed' } });
    expect(useRuntime.getState().snapshot).toBe(snapshot);
  });
  it('invalidates runtime on program edit and ignores late scheduler ticks', () => {
    const doc = createDocument();
    useEditor.getState().hydrate(doc);
    useRuntime.getState().run(doc);
    useEditor.getState().change(insertInstruction(doc, doc.program.startId, { id: crypto.randomUUID(), kind: 'output', mode: 'text', text: 'New' }));
    useRuntime.getState().tick();
    expect(useRuntime.getState().snapshot.status).toBe('idle');
    expect(useRuntime.getState().snapshot.output).toEqual([]);
    expect(useRuntime.getState().machine).toBeNull();
  });
  it('exposes compilation diagnostics without starting a machine', () => {
    const doc = createDocument();
    useRuntime.getState().run(insertInstruction(doc, doc.program.startId, { id: crypto.randomUUID(), kind: 'output', mode: 'expression', text: 'unknown' }));
    expect(useRuntime.getState().machine).toBeNull();
    expect(useRuntime.getState().snapshot.status).toBe('error');
    expect(useRuntime.getState().snapshot.events).toEqual([]);
  });
});
