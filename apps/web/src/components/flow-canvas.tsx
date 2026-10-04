'use client';
import { memo, useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow, Background, BackgroundVariant, Controls, Handle, Position,
  BaseEdge, EdgeLabelRenderer, getSmoothStepPath, MarkerType, useNodesState,
  type Node, type NodeProps, type EdgeProps, type Edge,
} from '@xyflow/react';
import { Plus } from 'lucide-react';
import { flattenInstructions, isLoop, instructionLabel, moveInstruction, projectFlow, type Branch, type FlowBranch, type InsertionPoint } from '@flowlab/domain';
import { useEditor } from '../lib/editor-store';
import { useRuntime } from '../lib/runtime-store';
import { copy, instructions } from '../lib/copy';
import { courseProfile } from '../lib/config';

type FlowNode = Node<{ label: string; term: string; shape: string; loop?: boolean; executed?: boolean; active?: boolean; terminal?: 'start' | 'end' }>;
const AlgorithmNode = memo(function AlgorithmNode({ data, selected }: NodeProps<FlowNode>) {
  if (data.shape === 'merge') return <div className={`merge-node ${data.executed ? 'is-executed' : ''}`} title="Penggabungan otomatis"><Handle type="target" position={Position.Top} isConnectable={false} /><Handle type="source" position={Position.Bottom} isConnectable={false} /></div>;
  return <div data-executed={!!data.executed} className={`algorithm-node ${data.shape} ${selected ? 'is-selected' : ''} ${data.executed ? 'is-executed' : ''} ${data.active ? 'is-active' : ''}`}>
    {data.terminal !== 'start' && <Handle type="target" position={Position.Top} isConnectable={false} />}
    {data.shape === 'diamond' && <svg className="decision-symbol" viewBox="0 0 220 112" aria-hidden="true"><polygon points="110,1 219,56 110,111 1,56" /></svg>}
    <div className="node-content"><span className="node-term">{data.executed ? '✓ ' : ''}{data.term}</span><span className="node-label">{data.label}</span></div>
    {data.loop ? <><Handle id="loop-back" type="target" position={Position.Left} isConnectable={false} /><Handle id="body" type="source" position={Position.Bottom} isConnectable={false} /><Handle id="exit" type="source" position={Position.Right} isConnectable={false} /></> : data.shape === 'diamond' ? <><Handle id="consequent" type="source" position={Position.Left} isConnectable={false} /><Handle id="alternate" type="source" position={Position.Right} isConnectable={false} /></> : data.terminal !== 'end' && <Handle type="source" position={Position.Bottom} isConnectable={false} />}
  </div>;
});
type InsertEdgeData = { onInsert: (afterId: string, branch?: Branch) => void; insertion: InsertionPoint; branch?: FlowBranch; loopBack?: boolean; laneX?: number; emptyBranch?: boolean; executed: boolean; order: number; disabled: boolean };
function InsertEdge(props: EdgeProps<Edge<InsertEdgeData>>) {
  let [path, x, y] = getSmoothStepPath(props);
  const branch = props.data?.branch;
  if (props.data?.loopBack) {
    const lane = props.data.laneX!;
    path = `M ${props.sourceX} ${props.sourceY} V ${props.sourceY + 35} H ${lane} V ${props.targetY} H ${props.targetX}`;
    x = lane; y = (props.sourceY + 35 + props.targetY) / 2;
  } else if (branch === 'exit') {
    const lane = props.data?.laneX ?? props.sourceX + 85;
    path = `M ${props.sourceX} ${props.sourceY} H ${lane} V ${props.targetY - 35} H ${props.targetX} V ${props.targetY}`;
    x = lane; y = props.sourceY + 35;
  } else if (branch && branch !== 'body') {
    const lane = props.data?.emptyBranch ? props.sourceX + (branch === 'consequent' ? -140 : 140) : props.targetX;
    path = props.data?.emptyBranch
      ? `M ${props.sourceX} ${props.sourceY} H ${lane} V ${props.targetY - 35} H ${props.targetX} V ${props.targetY}`
      : `M ${props.sourceX} ${props.sourceY} H ${lane} V ${props.targetY}`;
    x = lane; y = props.data?.emptyBranch ? props.sourceY + 35 : (props.sourceY + props.targetY) / 2;
  }
  return <>
    <BaseEdge path={path} markerEnd={props.markerEnd} style={props.style} />
    <EdgeLabelRenderer>{branch === 'exit' ? <span className={`loop-exit-label ${props.data?.executed ? 'is-executed' : ''}`} style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}>{props.data?.executed ? '✓ ' : ''}{courseProfile.booleanLabels.exit}</span> : <button
      className={`insert-button nodrag nopan ${branch ? 'branch-insert' : ''} ${props.data?.executed ? 'is-executed' : ''}`}
      style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}
      aria-label={branch === 'body' ? `${copy.addLoopBody} ${props.data?.order}` : props.data?.loopBack ? `Tambah langkah sebelum mengulang ${props.data.order}` : branch ? `${copy.insert} cabang ${courseProfile.booleanLabels[branch]} ${props.data?.order}` : `${copy.insert} ${props.data?.order ?? ''}`}
      disabled={props.data?.disabled}
      onClick={() => props.data && props.data.onInsert(props.data.insertion.afterId, props.data.insertion.branch)}
    >{branch && <span>{props.data?.executed && <span aria-hidden="true">✓ </span>}{courseProfile.booleanLabels[branch]}</span>}<Plus size={15} /></button>}</EdgeLabelRenderer>
  </>;
}
const nodeTypes = { algorithm: AlgorithmNode };
const edgeTypes = { insert: InsertEdge };

export function FlowCanvas({ onInsert, onSelect }: { onInsert: (id: string, branch?: Branch) => void; onSelect: (id: string) => void }) {
  const document = useEditor((s) => s.history.present);
  const selectedId = useEditor((s) => s.selectedId);
  const snapshot = useRuntime((s) => s.snapshot);
  const projection = useMemo(() => projectFlow(document), [document]);
  const instructionMap = useMemo(() => new Map(flattenInstructions(document.program.instructions).map(i => [i.id, i])), [document]);
  const trace = useMemo(() => ({ visited: new Set(snapshot.visitedNodeIds), edges: new Set(snapshot.traversedEdgeIds) }), [snapshot.visitedNodeIds, snapshot.traversedEdgeIds]);
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  useEffect(() => {
    setNodes(Object.entries(projection.positions).map(([id, position]): FlowNode => {
      const instruction = instructionMap.get(id);
      const terminal = id === document.program.startId ? 'start' : 'end';
      const merge = id.startsWith('merge:');
      const state = { executed: trace.visited.has(id), active: snapshot.currentInstructionId === id && ['running', 'waiting_for_input', 'error'].includes(snapshot.status) };
      return {
        id, type: 'algorithm', position, selected: selectedId === id, draggable: !merge, selectable: !merge, focusable: !merge,
        data: merge ? { label: '', term: '', shape: 'merge', ...state } : instruction ? {
          label: instructionLabel(instruction), term: instructions[instruction.kind].term,
          loop: isLoop(instruction), shape: instruction.kind === 'decision' || isLoop(instruction) ? 'diamond' : ['input', 'output'].includes(instruction.kind) ? 'parallelogram' : instruction.kind === 'declaration' ? courseProfile.declarationSymbol : 'rectangle', ...state,
        } : { label: terminal === 'start' ? copy.start : copy.end, term: terminal.toUpperCase(), shape: 'terminator', terminal, ...state },
      };
    }));
  }, [document, projection, instructionMap, selectedId, setNodes, trace, snapshot.currentInstructionId, snapshot.status]);
  const edges: Edge<InsertEdgeData>[] = projection.edges.map((edge, index) => {
    const executed = trace.edges.has(edge.id), color = executed ? 'var(--primary)' : 'var(--flow-edge)';
    return {
      id: edge.id, source: edge.source, target: edge.target, type: 'insert', sourceHandle: edge.branch, targetHandle: edge.loopBack ? 'loop-back' : undefined,
      className: `${edge.loopBack ? 'loop-back-edge ' : ''}${executed ? 'flow-traversed' : ''}`,
      /* Highlight is independent of the truncated event log. */
      data: { onInsert, insertion: edge.insertion, branch: edge.branch, emptyBranch: edge.emptyBranch, loopBack: edge.loopBack, laneX: edge.laneX, executed, order: index + 1, disabled: instructionMap.size >= 300 },
      markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color },
      style: { stroke: color, strokeWidth: executed ? 2.8 : 1.4 },
    };
  });
  const onDragStop = useCallback((_: unknown, node: FlowNode) => {
    const store = useEditor.getState();
    store.change(moveInstruction(store.history.present, node.id, node.position));
  }, []);
  return <ReactFlow<FlowNode, Edge<InsertEdgeData>>
    nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
    onNodesChange={onNodesChange} onNodeDragStop={onDragStop}
    onNodeClick={(_, node) => { if (node.data.shape !== 'merge') onSelect(node.id); }} onNodeDoubleClick={(_, node) => { if (node.data.shape !== 'merge') onSelect(node.id); }}
    nodesConnectable={false} edgesReconnectable={false} deleteKeyCode={null}
    onPaneClick={() => useEditor.getState().select(null)}
    fitView fitViewOptions={{ maxZoom: 1, padding: 0.5 }} minZoom={0.2} maxZoom={1.75}
    defaultEdgeOptions={{ focusable: false }}
    ariaLabelConfig={{ 'controls.zoomIn.ariaLabel': 'Perbesar', 'controls.zoomOut.ariaLabel': 'Perkecil', 'controls.fitView.ariaLabel': copy.fit }}
  >
    <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="var(--canvas-grid)" />
    <Controls showInteractive={false} position="bottom-left" />
  </ReactFlow>;
}
