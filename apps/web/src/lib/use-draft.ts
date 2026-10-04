'use client';
import { useEffect, useRef, useState } from 'react';
import { parseDocument } from '@flowlab/flow-schema';
import { useEditor } from './editor-store';

export const DRAFT_KEY = 'flowlab.draft.v1';
export type SaveStatus = 'loading' | 'saving' | 'saved' | 'error' | 'corrupt' | 'conflict';
export function useDraft() {
  const document = useEditor((s) => s.history.present);
  const hydrate = useEditor((s) => s.hydrate);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<SaveStatus>('loading');
  const [generation, setGeneration] = useState(0);
  const lastSaved = useRef<string | null>(null);
  const locked = useRef(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      lastSaved.current = raw;
      if (raw) {
        try { hydrate(parseDocument(raw)); }
        catch { locked.current = true; setStatus('corrupt'); }
      }
    } catch { setStatus('error'); }
    setReady(true);
  }, [hydrate]);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if ((event.key === DRAFT_KEY || event.key === null) && event.newValue !== lastSaved.current) {
        locked.current = true;
        setStatus('conflict');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  useEffect(() => {
    if (!ready || locked.current) return;
    const serialized = JSON.stringify(document);
    setStatus('saving');
    const timer = window.setTimeout(() => {
      if (locked.current) return;
      try {
        if (localStorage.getItem(DRAFT_KEY) !== lastSaved.current) {
          locked.current = true;
          setStatus('conflict');
          return;
        }
        localStorage.setItem(DRAFT_KEY, serialized);
        lastSaved.current = serialized;
        setStatus('saved');
      } catch { setStatus('error'); }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [document, ready, generation]);
  // Flush the last edit on navigation; preserve external/corrupt drafts.
  useEffect(() => {
    const flush = () => {
      if (!ready || locked.current) return;
      try {
        if (localStorage.getItem(DRAFT_KEY) !== lastSaved.current) return;
        const serialized = JSON.stringify(useEditor.getState().history.present);
        localStorage.setItem(DRAFT_KEY, serialized);
        lastSaved.current = serialized;
      } catch { /* UI already offers JSON export for restricted storage. */ }
    };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, [ready]);
  function reload() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) { window.location.reload(); return; }
      hydrate(parseDocument(raw));
      lastSaved.current = raw;
      locked.current = false;
      setGeneration((v) => v + 1);
    } catch { setStatus('corrupt'); }
  }
  function discard() {
    try {
      localStorage.removeItem(DRAFT_KEY);
      lastSaved.current = null;
      locked.current = false;
      setGeneration((v) => v + 1);
    } catch { setStatus('error'); }
  }
  return { ready, status, reload, discard };
}
