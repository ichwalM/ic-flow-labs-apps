'use client';
import { useState, type FormEvent } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Braces, Equal, Search, Trash2, X, ArrowLeft, GitBranch, Repeat2, ListRestart } from 'lucide-react';
import { isLoop, dataTypes, type Branch, type DataType, type Instruction, type InstructionKind } from '@flowlab/domain';
import { instructionSchema } from '@flowlab/flow-schema';
import { copy, instructions } from '../lib/copy';
import { courseProfile } from '../lib/config';
import { runtimeCopy } from '../lib/runtime-copy';

export const instructionIcons = { declaration: Braces, assignment: Equal, input: ArrowDownToLine, output: ArrowUpFromLine, decision: GitBranch, while: Repeat2, for: ListRestart };
export function ActionPicker({ onPick, onClose }: { onPick: (kind: InstructionKind) => void; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const filtered = courseProfile.allowedInstructions.filter((kind) => `${instructions[kind].title} ${instructions[kind].term}`.toLowerCase().includes(search.toLowerCase()));
  return <>
    <div className="panel-heading"><span>{copy.insert}</span><button className="icon-button" aria-label={copy.close} onClick={onClose}><X size={18} /></button></div>
    <div className="panel-body"><h2>{copy.pickerTitle}</h2><p className="muted">{copy.pickerDescription}</p>
      <label className="search-field"><Search size={17} /><input autoFocus aria-label={copy.search} placeholder={copy.search} value={search} onChange={(e) => setSearch(e.target.value)} /></label>
      <h3 className="eyebrow">{copy.basics}</h3>
      <div className="action-list">{filtered.map((kind) => {
        const Icon = instructionIcons[kind];
        return <button key={kind} className="action-option" onClick={() => onPick(kind)}>
          <span className={`action-icon ${kind}`}><Icon size={19} /></span><span><strong>{instructions[kind].title}</strong><small>{instructions[kind].description}</small></span>
        </button>;
      })}</div>
      {filtered.length === 0 && <p className="muted">Tidak ada instruksi yang cocok.</p>}
      <div className="future-note"><strong>{copy.future}</strong><p>{copy.futureDetail}</p></div>
    </div>
  </>;
}

export function InstructionForm({ kind, current, onSave, onClose, onBack, onDelete, onBranch }: {
  kind: InstructionKind; current?: Instruction; onSave: (instruction: Instruction) => void;
  onClose: () => void; onBack?: () => void; onDelete?: () => void; onBranch?: (branch?: Branch) => void;
}) {
  const [error, setError] = useState(false);
  const [outputMode, setOutputMode] = useState<'text' | 'expression'>(current?.kind === 'output' ? current.mode : 'text');
  const Icon = instructionIcons[kind];
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const get = (key: string) => String(form.get(key) ?? '');
    const id = current?.id ?? crypto.randomUUID();
    let instruction: Instruction;
    switch (kind) {
      case 'while': instruction = { id, kind, condition: get('condition').trim(), body: current && isLoop(current) ? current.body : [] }; break;
      case 'for': instruction = { id, kind, counter: get('counter').trim(), from: get('from').trim(), to: get('to').trim(), step: get('step').trim(), body: current && isLoop(current) ? current.body : [] }; break;
      case 'decision': instruction = { id, kind, condition: get('condition').trim(), consequent: current?.kind === 'decision' ? current.consequent : [], alternate: current?.kind === 'decision' ? current.alternate : [] }; break;
      case 'declaration': instruction = { id, kind, name: get('name').trim(), dataType: get('dataType') as DataType, initialValue: get('initialValue').trim() }; break;
      case 'assignment': instruction = { id, kind, target: get('target').trim(), expression: get('expression').trim() }; break;
      case 'input': instruction = { id, kind, target: get('target').trim(), prompt: get('prompt') }; break;
      case 'output': instruction = { id, kind, mode: outputMode, text: get('text') }; break;
    }
    const result = instructionSchema.safeParse(instruction);
    if (!result.success) { setError(true); return; }
    setError(false);
    onSave(result.data);
  }
  const variableProps = { required: true, maxLength: 64, pattern: '[A-Za-z_][A-Za-z0-9_]*' };
  return <>
    <div className="panel-heading"><span>{copy.inspector}</span><button className="icon-button" aria-label={copy.close} onClick={onClose}><X size={18} /></button></div>
    <form className="panel-body instruction-form" onSubmit={submit}>
      {onBack && <button type="button" className="text-button back-button" onClick={onBack}><ArrowLeft size={15} />{copy.insert}</button>}
      <span className={`large-action-icon ${kind}`}><Icon size={23} /></span>
      <div><h2>{instructions[kind].title}</h2><p className="muted">{instructions[kind].description}</p></div>
      {(kind === 'decision' || kind === 'while') && <label>{copy.condition}<textarea autoFocus required name="condition" maxLength={2000} defaultValue={current && (current.kind === 'decision' || current.kind === 'while') ? current.condition : ''} placeholder="nilai >= 75" /><small>{kind === 'while' ? copy.loopConditionHint : copy.conditionHint}</small></label>}
      {kind === 'for' && <>
        <label>{copy.counter}<input autoFocus name="counter" placeholder="i" defaultValue={current?.kind === 'for' ? current.counter : ''} {...variableProps} /></label>
        <label>{copy.from}<input name="from" required maxLength={2000} defaultValue={current?.kind === 'for' ? current.from : '1'} /></label>
        <label>{copy.to}<input name="to" required maxLength={2000} defaultValue={current?.kind === 'for' ? current.to : '10'} /></label>
        <label>{copy.step}<input name="step" required maxLength={2000} defaultValue={current?.kind === 'for' ? current.step : '1'} /><small>{copy.forHint}</small></label>
      </>}
      {(kind === 'while' || kind === 'for') && <p className="muted">{copy.loopScopeHint}</p>}
      {kind === 'declaration' && <>
        <label>{copy.name}<input autoFocus name="name" placeholder="nilai" defaultValue={current?.kind === kind ? current.name : ''} {...variableProps} /><small>{copy.nameHint}</small></label>
        <label>{copy.type}<select name="dataType" defaultValue={current?.kind === kind ? current.dataType : 'Integer'}>{dataTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
        <label>{copy.initial}<input name="initialValue" maxLength={2000} placeholder="0" defaultValue={current?.kind === kind ? current.initialValue : ''} /><small>{runtimeCopy.initialHint}</small></label>
      </>}
      {(kind === 'assignment' || kind === 'input') && <label>{copy.target}<input autoFocus name="target" placeholder="nilai" defaultValue={current && (current.kind === 'assignment' || current.kind === 'input') ? current.target : ''} {...variableProps} /><small>{copy.nameHint}</small></label>}
      {kind === 'assignment' && <label>{copy.expression}<textarea name="expression" required maxLength={2000} defaultValue={current?.kind === kind ? current.expression : ''} placeholder="harga * jumlah" /><small>{copy.expressionHint}</small></label>}
      {kind === 'input' && <label>{copy.prompt}<textarea name="prompt" maxLength={2000} defaultValue={current?.kind === kind ? current.prompt : ''} placeholder="Masukkan nilaimu:" /></label>}
      {kind === 'output' && <><label>{runtimeCopy.outputMode}<select value={outputMode} onChange={(e) => setOutputMode(e.target.value as 'text' | 'expression')}><option value="text">{runtimeCopy.textMode}</option><option value="expression">{runtimeCopy.expressionMode}</option></select></label><label>{outputMode === 'text' ? copy.output : runtimeCopy.outputExpression}<textarea autoFocus required name="text" maxLength={2000} defaultValue={current?.kind === kind ? current.text : ''} placeholder={outputMode === 'text' ? 'Halo Dunia' : '"Luas: " + luas'} /><small>{outputMode === 'text' ? copy.literalHint : runtimeCopy.outputHint}</small></label></>}
      {error && <p role="alert" className="error-text">{copy.formError}</p>}
      <button type="submit" className="button primary">{current ? copy.saveInstruction : copy.addInstruction}</button>
      {current?.kind === 'decision' && onBranch && <div className="branch-actions"><p className="muted">Penyisipan cabang dimulai tepat setelah kondisi.</p>{(['consequent', 'alternate'] as const).map(branch => <button type="button" className="button secondary" key={branch} onClick={() => onBranch(branch)}>Tambah di cabang {courseProfile.booleanLabels[branch]}</button>)}<button type="button" className="button secondary" onClick={() => onBranch()}>Tambah setelah penggabungan</button></div>}
      {current && isLoop(current) && onBranch && <div className="branch-actions"><button type="button" className="button secondary" onClick={() => onBranch('body')}>{copy.addLoopBody}</button><button type="button" className="button secondary" onClick={() => onBranch()}>{copy.afterLoop}</button></div>}
      {onDelete && <button type="button" className="button danger-quiet" onClick={onDelete}><Trash2 size={16} />{copy.delete}</button>}
    </form>
  </>;
}
