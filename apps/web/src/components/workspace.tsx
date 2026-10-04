'use client';
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import {
  ArrowDownToLine, ArrowUpFromLine, BookOpen, Check, ChevronRight, CircleHelp,
  FilePlus2, Focus, GitBranch, Lightbulb, ListOrdered, PanelLeftClose,
  Plus, Redo2, Route, Undo2, WandSparkles, X,
} from 'lucide-react';
import { arrange, isLoop, createDocument, deleteInstruction, findInstruction, flattenInstructions, insertInstruction, instructionLabel, MAX_INSTRUCTIONS, positionOf, updateInstruction, type Branch, type Instruction, type InstructionKind } from '@flowlab/domain';
import { MAX_FILE_BYTES, parseDocument } from '@flowlab/flow-schema';
import { useEditor } from '../lib/editor-store';
import { useDraft, DRAFT_KEY } from '../lib/use-draft';
import { copy } from '../lib/copy';
import { product, courseProfile } from '../lib/config';
import { FlowCanvas } from './flow-canvas';
import { ActionPicker, InstructionForm, instructionIcons } from './instruction-panel';
import { RuntimePanel, RuntimeToolbar, RuntimeVariables } from './runtime-panel';

type Panel = { type: 'insert'; afterId: string; branch?: Branch; kind?: InstructionKind } | { type: 'edit'; id: string } | null;
function download(source: string, name: string) {
  const url = URL.createObjectURL(new Blob([source], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function WorkspaceContent() {
  const { history, selectedId, change, select, undo, redo } = useEditor();
  const document = history.present;
  const draft = useDraft();
  const flow = useReactFlow();
  const [panel, setPanel] = useState<Panel>(null);
  const [guideOpen, setGuideOpen] = useState(true);
  const [toast, setToast] = useState('');
  const importRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const allInstructions = flattenInstructions(document.program.instructions);
  const count = allInstructions.length;
  const current = panel?.type === 'edit' ? findInstruction(document, panel.id) : undefined;
  const declarations = allInstructions.filter((i) => i.kind === 'declaration');
  useEffect(() => {
    if (window.matchMedia('(max-width: 680px)').matches) setGuideOpen(false);
  }, []);
  const closePanel = useCallback(() => {
    setPanel(null);
    window.requestAnimationFrame(() => lastFocused.current?.focus());
  }, []);
  const rememberFocus = useCallback(() => { lastFocused.current = window.document.activeElement as HTMLElement; }, []);
  const openInsert = useCallback((afterId: string, branch?: Branch) => {
    rememberFocus();
    if (flattenInstructions(useEditor.getState().history.present.program.instructions).length >= MAX_INSTRUCTIONS) { setToast(copy.limit); return; }
    setPanel({ type: 'insert', afterId, branch });
  }, [rememberFocus]);
  const selectNode = useCallback((id: string) => {
    select(id);
    const doc = useEditor.getState().history.present;
    if (findInstruction(doc, id)) { rememberFocus(); setPanel({ type: 'edit', id }); }
    else setPanel(null);
  }, [select, rememberFocus]);
  const remove = useCallback((id: string) => {
    const state = useEditor.getState();
    const instruction = findInstruction(state.history.present, id);
    if (!instruction) return;
    if (instruction.kind === 'decision' && (instruction.consequent.length || instruction.alternate.length) && !window.confirm(copy.deleteDecisionConfirm)) return;
    if (isLoop(instruction) && instruction.body.length && !window.confirm(copy.deleteLoopConfirm)) return;
    state.change(deleteInstruction(state.history.present, id));
    select(null); closePanel();
  }, [closePanel, select]);
  const focusNode = (id: string) => {
    selectNode(id);
    const position = positionOf(document, id);
    void flow.setCenter(position.x + 110, position.y + 35, { zoom: Math.max(0.7, flow.getZoom()), duration: 0 });
  };
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const editing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
      if (event.key === 'Escape') { closePanel(); return; }
      if (editing) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
        setPanel(null);
      }
      if (event.key === 'Delete' && selectedId) {
        remove(selectedId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closePanel, redo, undo, selectedId, remove]);
  function save(instruction: Instruction) {
    if (!panel) return;
    try {
      change(panel.type === 'insert' ? insertInstruction(document, panel.afterId, instruction, panel.branch) : updateInstruction(document, instruction));
    } catch (error) { setToast(error instanceof Error && error.message === 'BRANCH_DEPTH_LIMIT' ? copy.depthLimit : copy.limit); return; }
    select(instruction.id);
    setPanel({ type: 'edit', id: instruction.id });
    // Preserve zoom; only follow a newly inserted node if it is outside the viewport.
    if (panel.type === 'insert') {
      const next = useEditor.getState().history.present;
      const p = positionOf(next, instruction.id);
      const screen = flow.flowToScreenPosition(p);
      const bounds = window.document.querySelector('.canvas')?.getBoundingClientRect();
      if (bounds && (screen.y < bounds.top + 90 || screen.y + 80 > bounds.bottom - 60 || screen.x < bounds.left || screen.x + 220 > bounds.right)) {
        void flow.setCenter(p.x + 110, p.y + 35, { zoom: flow.getZoom(), duration: 0 });
      }
    }
  }
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      if (file.size > MAX_FILE_BYTES) throw new Error('FILE_TOO_LARGE');
      const next = parseDocument(await file.text());
      if (count && !window.confirm(copy.importConfirm)) return;
      change(next); setPanel(null); select(null); setToast(copy.imported);
      window.setTimeout(() => void flow.fitView({ padding: 0.3, maxZoom: 1 }), 100);
    } catch { setToast(copy.invalidImport); }
  }
  function newProject() {
    if (count && !window.confirm(copy.newConfirm)) return;
    change(createDocument()); setPanel(null); select(null);
    window.setTimeout(() => void flow.fitView({ padding: 0.5, maxZoom: 1 }), 100);
  }
  function exportDocument() {
    download(JSON.stringify(document, null, 2), `${document.metadata.title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'algoritma'}.flow.json`);
    setToast(copy.exported);
  }
  if (!draft.ready) return <div className="loading-state"><Route size={30} /><p>{copy.loading}</p></div>;
  const statusText = draft.status === 'saved' ? copy.saved : draft.status === 'saving' ? copy.saving : copy.localOnly;
  return <div className="workspace">
    <header className="topbar">
      <a href="/" className="brand" aria-label={`${product.name} — ${copy.workspace}`}><span className="brand-mark"><Route size={23} /></span><span>{product.name}<small>{product.institution}</small></span></a>
      <div className="header-divider" />
      <div className="project-heading"><div className="breadcrumb">{copy.workspace}<ChevronRight size={13} /><span>{copy.main}</span></div>
        <ProjectTitle title={document.metadata.title} onRename={(title) => change({ ...document, metadata: { ...document.metadata, title } })} />
      </div>
      <div className="header-actions"><span className="save-status" role="status">{draft.status === 'saved' ? <Check size={14} /> : <span className="status-dot" />}{statusText}</span>
        <button className="button secondary import-action" onClick={() => importRef.current?.click()}><ArrowUpFromLine size={16} />{copy.import}</button>
        <button className="button primary" onClick={exportDocument}><ArrowDownToLine size={16} /><span>{copy.export}</span></button>
      </div>
      <input hidden ref={importRef} type="file" accept=".json,application/json" onChange={importFile} aria-label="Pilih file algoritma" />
    </header>
    {(draft.status === 'error' || draft.status === 'corrupt' || draft.status === 'conflict') && <div className="save-alert" role="alert" aria-label={copy.saveAlert}>
      <span>{draft.status === 'conflict' ? copy.conflict : draft.status === 'corrupt' ? copy.loadError : copy.saveError}</span>
      {draft.status === 'conflict' && <button onClick={draft.reload}>{copy.reload}</button>}
      {draft.status === 'corrupt' && <><button onClick={() => { try { download(localStorage.getItem(DRAFT_KEY) ?? '', 'flowlab-recovery.json'); } catch { setToast(copy.saveError); } }}>{copy.recover}</button><button onClick={draft.discard}>{copy.discard}</button></>}
    </div>}
    <div className="workspace-body">
      {guideOpen && <aside className="guide-panel">
        <div className="panel-heading"><span><BookOpen size={17} />{copy.guide}</span><button className="icon-button" aria-label="Tutup panduan" onClick={() => setGuideOpen(false)}><PanelLeftClose size={17} /></button></div>
        <div className="guide-intro"><span className="lesson-badge">01 <span>BERPIKIR BERURUTAN</span></span><h1>{copy.introTitle}</h1><p>{copy.introDescription}</p></div>
        <ol className="learning-steps">{copy.steps.map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}</ol>
        <div className="challenge"><span><Lightbulb size={17} />{copy.goalTitle}</span><p>{copy.goal}</p></div>
        <div className="outline-heading"><h2><ListOrdered size={16} />{copy.outline}</h2><span>{count + 2}</span></div>
        <nav className="outline-list" aria-label={copy.outline}>
          <button onClick={() => focusNode(document.program.startId)}><span className="outline-dot" />{copy.start}<small>START</small></button>
          <InstructionOutline block={document.program.instructions} selectedId={selectedId} onSelect={focusNode} />
          <button onClick={() => focusNode(document.program.endId)}><span className="outline-dot end" />{copy.end}<small>END</small></button>
        </nav>
        <button className="new-project text-button" onClick={newProject}><FilePlus2 size={16} />{copy.newProject}</button>
        <div className="guide-footer"><span className="mini-brand">IC</span><span>INFORMATICS COMPUTER LABORATORY<small>Belajar dari setiap langkah.</small></span></div>
      </aside>}
      <main className="editor-main">
        <div className="toolbar"><div className="toolbar-start">{!guideOpen && <button className="icon-button" aria-label={copy.help} onClick={() => setGuideOpen(true)}><BookOpen size={18} /></button>}<span className="tab"><GitBranch size={16} />{copy.main}<span className="tab-dot" /></span><span className="mode-label">{copy.structure}</span></div>
          <div className="toolbar-actions"><button className="icon-button" aria-label={copy.undo} title="Urungkan (Ctrl/Cmd+Z)" disabled={!history.past.length} onClick={() => { undo(); setPanel(null); }}><Undo2 size={17} /></button><button className="icon-button" aria-label={copy.redo} title="Ulangi perubahan (Ctrl/Cmd+Shift+Z)" disabled={!history.future.length} onClick={() => { redo(); setPanel(null); }}><Redo2 size={17} /></button><span className="toolbar-divider" /><button className="text-button arrange-button" onClick={() => change(arrange(document))}><WandSparkles size={16} /><span>{copy.arrange}</span></button><button className="icon-button" aria-label={copy.fit} onClick={() => void flow.fitView({ padding: 0.3, maxZoom: 1 })}><Focus size={17} /></button></div>
          <RuntimeToolbar onRun={() => { setPanel(null); setGuideOpen(window.innerWidth > 680 && guideOpen); }} />
        </div>
        <section className="canvas" aria-label="Canvas flowchart">
          <div className="canvas-caption"><span className="eyebrow">ALGORITMA / {String(count).padStart(2, '0')} LANGKAH</span><h2>{count === 0 ? copy.emptyTitle : document.metadata.title}</h2><p>{count === 0 ? copy.emptyHint : copy.tip}</p></div>
          <FlowCanvas onInsert={openInsert} onSelect={selectNode} />
          <div className="canvas-bottom-note"><span className="status-dot" />{copy.preview}</div>
        </section>
        <RuntimePanel onFocus={focusNode} />
      </main>
      <aside ref={panelRef} className={`inspector-panel ${panel ? 'is-open' : ''}`} aria-label={panel?.type === 'insert' ? copy.insert : copy.inspector}>
        {panel?.type === 'insert' && !panel.kind ? <ActionPicker onPick={(kind) => setPanel({ ...panel, kind })} onClose={closePanel} />
          : panel?.type === 'insert' && panel.kind ? <InstructionForm key={`${panel.afterId}-${panel.branch}-${panel.kind}`} kind={panel.kind} onSave={save} onClose={closePanel} onBack={() => setPanel({ ...panel, kind: undefined })} />
          : current ? <InstructionForm key={`${current.id}-${JSON.stringify(current)}`} kind={current.kind} current={current} onSave={save} onClose={closePanel} onDelete={() => remove(current.id)} onBranch={(branch) => openInsert(current.id, branch)} />
          : <><div className="panel-heading"><span>{copy.inspector}</span><CircleHelp size={16} /></div><div className="inspector-empty"><span className="empty-inspector-icon"><BracesIcon /></span><h2>{copy.readyTitle}</h2><p>{copy.readyHint}</p><button className="button secondary" onClick={() => openInsert(document.program.instructions.at(-1)?.id ?? document.program.startId)}><Plus size={16} />{copy.insert}</button></div><div className="variables-section"><h3 className="eyebrow">{copy.variables}</h3>{declarations.length ? declarations.map((i) => <div className="variable-row" key={i.id}><code>{i.name}</code><span>{i.dataType}</span></div>) : <p>{copy.noVariables}</p>}<small>{copy.variableNote}</small></div></>}
        <RuntimeVariables hideEmpty />
      </aside>
    </div>
    <footer className="statusbar"><span><span className="status-dot" />{product.stage}</span><span>{count} {copy.count}<span className="statusbar-divider">·</span>{copy.local}</span><span>UTF-8 <span className="statusbar-divider">·</span> Indonesia</span></footer>
    {toast && <div className="toast" role="status"><span>{toast}</span><button className="icon-button" aria-label="Tutup notifikasi" onClick={() => setToast('')}><X size={16} /></button></div>}
  </div>;
}
function BracesIcon() { return <GitBranch size={28} strokeWidth={1.5} />; }
function InstructionOutline({ block, selectedId, onSelect }: { block: Instruction[]; selectedId: string | null; onSelect: (id: string) => void }) {
  return <>{block.map(instruction => {
    const Icon = instructionIcons[instruction.kind];
    return <div key={instruction.id}><button className={selectedId === instruction.id ? 'selected' : ''} onClick={() => onSelect(instruction.id)}><Icon size={15} /><span>{instructionLabel(instruction)}</span></button>
      {instruction.kind === 'decision' && (['consequent', 'alternate'] as const).map(branch => <div className="outline-branch" key={branch}><small>{courseProfile.booleanLabels[branch]}</small>{instruction[branch].length ? <InstructionOutline block={instruction[branch]} selectedId={selectedId} onSelect={onSelect} /> : <small className="muted"> · langsung bergabung</small>}</div>)}
      {isLoop(instruction) && <div className="outline-branch"><small>{copy.loopBody}</small>{instruction.body.length ? <InstructionOutline block={instruction.body} selectedId={selectedId} onSelect={onSelect} /> : <small className="muted"> · kosong</small>}</div>}
    </div>;
  })}</>;
}
function ProjectTitle({ title, onRename }: { title: string; onRename: (title: string) => void }) {
  const [value, setValue] = useState(title);
  useEffect(() => setValue(title), [title]);
  return <input aria-label={copy.title} value={value} maxLength={100} onChange={(e) => setValue(e.target.value)} onBlur={() => {
    const next = value.trim() || 'Algoritma tanpa judul';
    setValue(next); onRename(next);
  }} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} />;
}
export function Workspace() { return <ReactFlowProvider><WorkspaceContent /></ReactFlowProvider>; }
