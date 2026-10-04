'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AlertCircle, Play, RotateCcw, Square, Terminal } from 'lucide-react';
import { displayValue, type InputRequest } from '@flowlab/interpreter';
import { useEditor } from '../lib/editor-store';
import { useRuntime } from '../lib/runtime-store';
import { diagnosticMessage, runtimeCopy as copy, statusLabels } from '../lib/runtime-copy';

export function RuntimeToolbar({ onRun }: { onRun: () => void }) {
  const { snapshot, run, stop, reset } = useRuntime();
  const active = snapshot.status === 'running' || snapshot.status === 'waiting_for_input';
  return <div className="runtime-controls">
    <button className="icon-button" aria-label={copy.reset} title={copy.reset} onClick={reset} disabled={snapshot.status === 'idle'}><RotateCcw size={16} /></button>
    {active ? <button className="button secondary run-button" onClick={stop}><Square size={14} />{copy.stop}</button>
      : <button className="button primary run-button" onClick={() => { onRun(); run(useEditor.getState().history.present); }}><Play size={14} />{copy.run}</button>}
  </div>;
}

export function RuntimePanel({ onFocus }: { onFocus: (id: string) => void }) {
  const { snapshot, tick } = useRuntime();
  const [tab, setTab] = useState<'console' | 'problems' | 'variables'>('console');
  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (snapshot.status !== 'running') return;
    const timer = window.setTimeout(tick, 16);
    return () => window.clearTimeout(timer);
  }, [snapshot, tick]);
  useEffect(() => {
    if (snapshot.status === 'error') setTab('problems');
    if (snapshot.status === 'running' || snapshot.status === 'waiting_for_input') setTab('console');
  }, [snapshot.status]);
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [snapshot.output.length]);
  return <section className={`runtime-panel ${snapshot.status === 'idle' ? 'runtime-idle' : ''}`} aria-label="Eksekusi algoritma">
    <div className="runtime-heading">
      <div className="runtime-tabs" role="tablist" aria-label="Panel eksekusi" onKeyDown={(event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const tabs = ['console', 'problems', 'variables'] as const;
        const index = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (tabs.indexOf(tab) + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
        const next = tabs[index]!;
        setTab(next); document.getElementById(`${next}-tab`)?.focus();
      }}>
        <button id="console-tab" role="tab" tabIndex={tab === 'console' ? 0 : -1} aria-selected={tab === 'console'} aria-controls="runtime-content" onClick={() => setTab('console')}><Terminal size={14} />{copy.console}</button>
        <button id="problems-tab" role="tab" tabIndex={tab === 'problems' ? 0 : -1} aria-selected={tab === 'problems'} aria-controls="runtime-content" onClick={() => setTab('problems')}><AlertCircle size={14} />{copy.problems}{snapshot.diagnostics.length > 0 && <span className="problem-count">{snapshot.diagnostics.length}</span>}</button>
        <button id="variables-tab" role="tab" tabIndex={tab === 'variables' ? 0 : -1} aria-selected={tab === 'variables'} aria-controls="runtime-content" onClick={() => setTab('variables')}>{copy.showVariables}</button>
      </div>
      <span className={`runtime-status ${snapshot.status}`} role="status">{statusLabels[snapshot.status]}</span>
    </div>
    <div id="runtime-content" role="tabpanel" aria-labelledby={`${tab}-tab`} className="runtime-content">
      {tab === 'console' && <>
        <div className="console-output" role="log" aria-label="Output program" ref={logRef}>
          {snapshot.output.length ? snapshot.output.map((line, index) => <div className="output-line" key={index}><span aria-hidden="true">{index + 1}</span><pre>{line}</pre></div>) : <p className="runtime-empty">{snapshot.status === 'idle' ? copy.empty : copy.noOutput}</p>}
        </div>
        {snapshot.inputRequest && <InputPrompt key={snapshot.inputRequest.instructionId} request={snapshot.inputRequest} />}
      </>}
      {tab === 'problems' && <div className="runtime-problems">{snapshot.diagnostics.length ? snapshot.diagnostics.map((problem, index) => <button className="problem-item" key={index} disabled={!problem.instructionId} onClick={() => problem.instructionId && onFocus(problem.instructionId)}><AlertCircle size={16} /><span>{diagnosticMessage(problem)}{problem.instructionId && <small>{copy.goTo} →</small>}</span></button>) : <p className="runtime-empty">{copy.noProblems}</p>}</div>}
      {tab === 'variables' && <RuntimeVariables />}
    </div>
    <div className="runtime-footnote"><span>{snapshot.executionCount} {copy.steps}</span><span>{copy.resultHint}</span></div>
  </section>;
}
function InputPrompt({ request }: { request: InputRequest }) {
  const { submit, inputError } = useRuntime();
  const [raw, setRaw] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  function onSubmit(event: FormEvent) {
    event.preventDefault();
    submit(raw);
    if (useRuntime.getState().inputError) inputRef.current?.focus();
  }
  return <form className="runtime-input" onSubmit={onSubmit}>
    <label htmlFor="runtime-input">{request.prompt || `${copy.inputHint} ${request.target}`}<small>{request.target} · {request.dataType}</small></label>
    <div><input id="runtime-input" ref={inputRef} autoFocus aria-label={copy.input} value={raw} onChange={(e) => setRaw(e.target.value)} autoComplete="off" maxLength={10000} aria-invalid={!!inputError} aria-describedby={inputError ? 'input-error' : undefined} /><button className="button primary" type="submit">{copy.submit}</button></div>
    {inputError && <p id="input-error" role="alert" className="error-text">{diagnosticMessage(inputError)}</p>}
  </form>;
}
export function RuntimeVariables({ hideEmpty = false }: { hideEmpty?: boolean }) {
  const variables = useRuntime((s) => s.snapshot.variables);
  if (hideEmpty && !variables.length) return null;
  return <div className="runtime-variables" aria-label={copy.variables}>{hideEmpty && <h3 className="eyebrow">{copy.variables}</h3>}{variables.length ? variables.map((variable) => <div className="runtime-variable" key={variable.name}><span><code>{variable.name}</code><small>{variable.dataType}</small></span><code>{variable.value ? displayValue(variable.value) : copy.uninitialized}</code></div>) : <p className="runtime-empty">{copy.resultHint}</p>}</div>;
}
