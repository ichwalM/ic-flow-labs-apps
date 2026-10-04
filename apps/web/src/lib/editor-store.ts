import { create } from 'zustand';
import { commit, createDocument, redo, undo, type History, type ProjectDocument } from '@flowlab/domain';
import { useRuntime } from './runtime-store';

interface EditorStore {
  history: History;
  selectedId: string | null;
  change: (next: ProjectDocument) => void;
  hydrate: (document: ProjectDocument) => void;
  select: (id: string | null) => void;
  undo: () => void;
  redo: () => void;
}
export const useEditor = create<EditorStore>((set) => ({
  history: { present: createDocument(), past: [], future: [] },
  selectedId: null,
  change: (next) => set((state) => ({ history: commit(state.history, next) })),
  hydrate: (document) => set({ history: { present: document, past: [], future: [] }, selectedId: null }),
  select: (selectedId) => set({ selectedId }),
  undo: () => set((state) => ({ history: undo(state.history), selectedId: null })),
  redo: () => set((state) => ({ history: redo(state.history), selectedId: null })),
}));
// Execution belongs to the program revision, not the visual layout or edit history.
useEditor.subscribe((state, previous) => {
  if (state.history.present.program !== previous.history.present.program || state.history.present.metadata.id !== previous.history.present.metadata.id) useRuntime.getState().reset();
});
