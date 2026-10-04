import { create } from 'zustand';
import { compileProgram, emptySnapshot, Interpreter, type Diagnostic, type RuntimeSnapshot } from '@flowlab/interpreter';
import type { ProjectDocument } from '@flowlab/domain';

interface RuntimeStore {
  machine: Interpreter | null;
  snapshot: RuntimeSnapshot;
  inputError: Diagnostic | null;
  run: (document: ProjectDocument) => void;
  tick: () => void;
  submit: (raw: string) => void;
  stop: () => void;
  reset: () => void;
}
export const useRuntime = create<RuntimeStore>((set, get) => ({
  machine: null, snapshot: emptySnapshot(), inputError: null,
  run: (document) => {
    const compiled = compileProgram(document);
    if (!compiled.ok) {
      set({ machine: null, inputError: null, snapshot: { ...emptySnapshot(), status: 'error', diagnostics: compiled.diagnostics } });
      return;
    }
    const machine = new Interpreter(compiled.program);
    set({ machine, snapshot: machine.snapshot(), inputError: null });
  },
  tick: () => {
    const machine = get().machine;
    if (machine) set({ snapshot: machine.advance(128) });
  },
  submit: (raw) => {
    const machine = get().machine;
    if (machine) set({ inputError: machine.submitInput(raw), snapshot: machine.snapshot() });
  },
  stop: () => {
    const machine = get().machine;
    if (machine) set({ snapshot: machine.stop(), inputError: null });
  },
  reset: () => set({ machine: null, snapshot: emptySnapshot(), inputError: null }),
}));
