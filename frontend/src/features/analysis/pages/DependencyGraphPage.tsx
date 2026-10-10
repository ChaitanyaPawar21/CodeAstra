import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap, MarkerType, Position, Handle,
  useNodesState, useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import dagre from 'dagre';
import { X, AlertTriangle, FileCode, Layers, Folder, GitMerge, Package } from 'lucide-react';
import type { GraphNode as GNode } from '../../../shared/types/dashboard';
import { useAnalysis } from '../hooks/useAnalysis';

const FOLDER_THRESHOLD = 150; // collapse file view by folder past this many nodes

const colorMap: Record<string, string> = {
  entry: 'bg-rose-200 border-rose-500 text-rose-900',
  route: 'bg-indigo-200 border-indigo-500 text-indigo-900',
  controller: 'bg-purple-200 border-purple-500 text-purple-900',
  service: 'bg-emerald-200 border-emerald-600 text-emerald-900',
  repository: 'bg-teal-200 border-teal-600 text-teal-900',
  model: 'bg-amber-200 border-amber-600 text-amber-900',
  middleware: 'bg-cyan-200 border-cyan-600 text-cyan-900',
  config: 'bg-orange-200 border-orange-500 text-orange-900',
  util: 'bg-pink-200 border-pink-500 text-pink-900',
  types: 'bg-slate-800 border-slate-500 text-slate-100',
  'ui-page': 'bg-blue-200 border-blue-500 text-blue-900',
  'ui-component': 'bg-sky-200 border-sky-500 text-sky-900',
  state: 'bg-violet-200 border-violet-500 text-violet-900',
  'api-client': 'bg-lime-200 border-lime-600 text-lime-900',
  test: 'bg-green-200 border-green-600 text-green-900',
  other: 'bg-gray-200 border-gray-400 text-gray-800',
  utility: 'bg-pink-200 border-pink-500 text-pink-900',
  database: 'bg-rose-200 border-rose-500 text-rose-900',
  api: 'bg-sky-200 border-sky-500 text-sky-900',
  folder: 'bg-yellow-200 border-yellow-600 text-yellow-900',
};

const basename = (p: string) => p.split('/').pop() || p;
const topDir = (p: string) => (p.includes('/') ? p.slice(0, p.indexOf('/')) : '.');

// --- custom node ---
const GraphCard = ({ data }: any) => {
  const colorClass = colorMap[data.type] || colorMap.other;
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: data.dimmed ? 0.25 : 1 }}
      className={`relative rounded-lg border-2 px-3 py-2 ${colorClass} ${data.selected ? 'ring-2 ring-offset-1 ring-black scale-105' : ''}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-none" />
      <div className="flex flex-col items-center gap-0.5 min-w-[90px] max-w-[200px]">
        <span className="text-[8px] uppercase tracking-widest font-bold opacity-70">{data.type}{data.count ? ` · ${data.count}` : ''}</span>
        <span className="text-[11px] font-mono font-semibold truncate max-w-[190px]">{data.title}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-none" />
    </motion.div>
  );
};
const nodeTypes = { card: GraphCard };

// --- dagre layout ---
const layout = (nodes: any[], edges: any[]) => {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 90 });
  nodes.forEach((n) => g.setNode(n.id, { width: 180, height: 56 }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);

  // Dagre puts every root/isolated node on one rank -> one huge row. Wrap wide ranks into a grid
  // so the graph stays roughly square and labels readable at fitView zoom.
  const cols = Math.max(4, Math.ceil(Math.sqrt(nodes.length * 2)));
  const centerX = (g.graph().width ?? 0) / 2;
  const ranks = new Map<number, any[]>();
  nodes.forEach((n) => {
    const p = g.node(n.id);
    n.position = { x: p.x - 90, y: 0 };
    n.sourcePosition = Position.Bottom;
    n.targetPosition = Position.Top;
    ranks.set(p.y, [...(ranks.get(p.y) ?? []), n]);
  });
  let y = 0;
  [...ranks.keys()].sort((a, b) => a - b).forEach((rankY) => {
    const row = ranks.get(rankY)!.sort((a, b) => a.position.x - b.position.x);
    if (row.length <= cols) {
      row.forEach((n) => (n.position.y = y));
      y += 56 + 90;
      return;
    }
    row.forEach((n, i) => {
      const inRow = Math.min(cols, row.length - Math.floor(i / cols) * cols);
      n.position = { x: centerX + ((i % cols) - inRow / 2) * 220, y: y + Math.floor(i / cols) * 96 };
    });
    y += Math.ceil(row.length / cols) * 96 + 90;
  });
  return nodes;
};

type View = 'layered' | 'file';

export default function DependencyGraphPage() {
  const { analysisData } = useAnalysis();
  const graph = analysisData!.dependencyGraph;
  const allNodes = (graph.nodes || []) as GNode[];
  const stats = graph.stats;

  const [view, setView] = useState<View>('file');
  const [layerFilter, setLayerFilter] = useState<Set<string>>(new Set());
  const [langFilter, setLangFilter] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const layers = useMemo(() => [...new Set(allNodes.map((n) => n.type))], [allNodes]);
  const languages = useMemo(() => [...new Set(allNodes.map((n) => n.language).filter(Boolean))] as string[], [allNodes]);
  const nodeById = useMemo(() => new Map(allNodes.map((n) => [n.id, n])), [allNodes]);

  // Build the base (unstyled, positioned) graph for the chosen view + filters.
  const base = useMemo(() => {
    const activeLayer = (t: string) => layerFilter.size === 0 || layerFilter.has(t);
    const activeLang = (l?: string) => langFilter.size === 0 || (l ? langFilter.has(l) : false);
    const visible = allNodes.filter((n) => activeLayer(n.type) && activeLang(n.language));
    const visibleIds = new Set(visible.map((n) => n.id));

    // Layered view: one node per layer, edges from layerFlow.
    if (view === 'layered') {
      const counts = new Map<string, number>();
      visible.forEach((n) => counts.set(n.type, (counts.get(n.type) ?? 0) + 1));
      const nodes = [...counts.entries()].map(([layer, count]) => ({
        id: `L:${layer}`, type: 'card',
        data: { title: layer, type: layer, count, kind: 'layer' }, position: { x: 0, y: 0 },
      }));
      const flowMap = new Map<string, number>();
      (graph.layerFlow || []).forEach((f) => {
        if (counts.has(f.from) && counts.has(f.to) && f.from !== f.to)
          flowMap.set(`${f.from}>${f.to}`, (flowMap.get(`${f.from}>${f.to}`) ?? 0) + f.count);
      });
      const edges = [...flowMap.entries()].map(([k, count]) => {
        const [from, to] = k.split('>');
        return { id: `e:${k}`, source: `L:${from}`, target: `L:${to}`, label: String(count) };
      });
      return { nodes: layout(nodes, edges), edges, kind: 'layer' as const };
    }

    // File view, collapsed by folder when too large.
    if (visible.length > FOLDER_THRESHOLD) {
      const folders = new Map<string, number>();
      visible.forEach((n) => folders.set(topDir(n.label), (folders.get(topDir(n.label)) ?? 0) + 1));
      const nodes = [...folders.entries()].map(([dir, count]) => ({
        id: `D:${dir}`, type: 'card',
        data: { title: dir, type: 'folder', count, kind: 'folder' }, position: { x: 0, y: 0 },
      }));
      const fe = new Map<string, number>();
      (graph.edges || []).forEach((e) => {
        const s = nodeById.get(e.source), t = nodeById.get(e.target);
        if (!s || !t || !visibleIds.has(e.source) || !visibleIds.has(e.target)) return;
        const ds = topDir(s.label), dt = topDir(t.label);
        if (ds !== dt) fe.set(`${ds}>${dt}`, (fe.get(`${ds}>${dt}`) ?? 0) + 1);
      });
      const edges = [...fe.entries()].map(([k, count]) => {
        const [s, t] = k.split('>');
        return { id: `fe:${k}`, source: `D:${s}`, target: `D:${t}`, label: String(count) };
      });
      return { nodes: layout(nodes, edges), edges, kind: 'folder' as const };
    }

    // Plain file view.
    const nodes = visible.map((n) => ({
      id: n.id, type: 'card',
      data: { title: basename(n.label), type: n.type, kind: 'file' }, position: { x: 0, y: 0 },
    }));
    const edges = (graph.edges || [])
      .filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target))
      .map((e) => ({ id: `${e.source}-${e.target}`, source: e.source, target: e.target, data: { cyclic: e.cyclic } }));
    return { nodes: layout(nodes, edges), edges, kind: 'file' as const };
  }, [allNodes, view, layerFilter, langFilter, graph, nodeById]);

  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);

  // Re-style nodes/edges from selection without re-running layout.
  useEffect(() => {
    const sel = selectedId;
    const outgoing = new Set<string>();
    const incoming = new Set<string>();
    if (sel) {
      base.edges.forEach((e: any) => {
        if (e.source === sel) outgoing.add(e.target);
        if (e.target === sel) incoming.add(e.source);
      });
    }
    setNodes(base.nodes.map((n: any) => {
      const connected = !sel || n.id === sel || outgoing.has(n.id) || incoming.has(n.id);
      return { ...n, data: { ...n.data, dimmed: sel ? !connected : false, selected: n.id === sel } };
    }));
    setEdges(base.edges.map((e: any) => {
      const isOut = sel && e.source === sel;
      const isIn = sel && e.target === sel;
      const active = isOut || isIn;
      const cyclic = e.data?.cyclic;
      const stroke = cyclic ? '#dc2626' : active ? (isOut ? '#2563eb' : '#059669') : sel ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.35)';
      return {
        ...e,
        animated: !!active,
        style: { stroke, strokeWidth: active ? 2.5 : 1.5, strokeDasharray: cyclic ? '6 4' : undefined },
        markerEnd: { type: MarkerType.ArrowClosed, color: stroke },
        labelStyle: { fill: '#000', fontSize: 10, fontFamily: 'monospace' },
      };
    }));
  }, [base, selectedId, setNodes, setEdges]);

  const onNodeClick = useCallback((_: any, node: any) => {
    setSelectedId((cur) => (cur === node.id ? null : node.id));
  }, []);
  const onPaneClick = useCallback(() => setSelectedId(null), []);

  const selectedFile = selectedId && !selectedId.startsWith('L:') && !selectedId.startsWith('D:') ? nodeById.get(selectedId) : null;

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, v: string) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v); else next.add(v);
    setter(next);
  };

  return (
    <div className="h-[calc(100vh-80px)] w-full flex flex-col gap-3">
      {/* Banners */}
      {stats?.truncated && (
        <div className="shrink-0 rounded-lg border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-xs text-orange-200 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5" /> Repository truncated: {stats.truncatedReason}
        </div>
      )}
      {!!stats?.unsupportedLanguages?.length && (
        <div className="shrink-0 rounded-lg border border-slate-500/30 bg-slate-500/10 px-4 py-2 text-xs text-slate-300">
          Unsupported (shown as plain nodes, no edges): {stats.unsupportedLanguages.join(', ')}
        </div>
      )}

      <div className="flex-1 flex gap-3 min-h-0">
        {/* Controls + canvas */}
        <div className="flex-1 flex flex-col min-w-0 rounded-xl border border-black bg-[#FBF3C4] overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 p-2 border-b border-black/20 bg-[#FFFBE0] text-xs">
            <div className="flex rounded-md border border-black overflow-hidden">
              <button onClick={() => { setView('layered'); setSelectedId(null); }} className={`px-3 py-1 flex items-center gap-1 ${view === 'layered' ? 'bg-indigo-500 text-black' : 'text-black'}`}><Layers className="w-3 h-3" /> Layers</button>
              <button onClick={() => { setView('file'); setSelectedId(null); }} className={`px-3 py-1 flex items-center gap-1 ${view === 'file' ? 'bg-indigo-500 text-black' : 'text-black'}`}><FileCode className="w-3 h-3" /> Files</button>
            </div>
            <span className="text-black/40">·</span>
            <div className="flex flex-wrap gap-1">
              {layers.map((l) => (
                <button key={l} onClick={() => toggle(layerFilter, setLayerFilter, l)}
                  className={`px-2 py-0.5 rounded border font-mono ${layerFilter.has(l) || layerFilter.size === 0 ? colorMap[l] || colorMap.other : 'bg-transparent border-black/20 text-black/40'}`}>
                  {l}
                </button>
              ))}
            </div>
            {languages.length > 1 && (
              <>
                <span className="text-black/40">·</span>
                <div className="flex flex-wrap gap-1">
                  {languages.map((l) => (
                    <button key={l} onClick={() => toggle(langFilter, setLangFilter, l)}
                      className={`px-2 py-0.5 rounded border font-mono ${langFilter.has(l) ? 'bg-black text-white border-black' : 'bg-transparent border-black/30 text-black/60'}`}>
                      .{l}
                    </button>
                  ))}
                </div>
              </>
            )}
            {base.kind === 'folder' && (
              <span className="ml-auto flex items-center gap-1 text-black/60"><Folder className="w-3 h-3" /> collapsed by folder ({allNodes.length} files)</span>
            )}
          </div>

          <div className="flex-1 min-h-0">
            <ReactFlow
              nodes={nodes} edges={edges} nodeTypes={nodeTypes}
              onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick} onPaneClick={onPaneClick}
              fitView fitViewOptions={{ padding: 0.3 }} minZoom={0.05} maxZoom={2}
            >
              <Background color="rgba(0,0,0,0.06)" gap={24} size={1} />
              <Controls className="!bg-[#FFFBE0] !border !border-black" />
              <MiniMap className="!bg-[#FFFBE0] !border !border-black" nodeColor="#E8BE28" maskColor="rgba(0,0,0,0.1)" pannable zoomable />
            </ReactFlow>
          </div>
        </div>

        {/* Side panel (file nodes only) */}
        <AnimatePresence>
          {selectedFile && (
            <motion.div
              initial={{ x: 320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 320, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="w-80 shrink-0 rounded-xl border border-black bg-[#FDEFA8] flex flex-col overflow-hidden"
            >
              <div className={`p-4 border-b border-black ${colorMap[selectedFile.type] || colorMap.other}`}>
                <button onClick={() => setSelectedId(null)} className="float-right p-1 hover:bg-black/10 rounded"><X className="w-4 h-4" /></button>
                <div className="text-[10px] uppercase tracking-widest font-bold opacity-70">{selectedFile.type}</div>
                <div className="text-sm font-bold font-mono break-all">{selectedFile.label}</div>
              </div>
              <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs text-black">
                <Row label="Language">{selectedFile.language || '—'}</Row>
                <Row label="Lines">{selectedFile.loc ?? '—'}</Row>
                <Row label="Layer reason">{selectedFile.layerReason || '—'}</Row>
                <List title={`Imports (${selectedFile.imports?.length ?? 0})`} items={(selectedFile.imports ?? []).map((id) => basename(nodeById.get(id)?.label || id))} empty="No internal imports" />
                <List title={`Imported by (${selectedFile.importedBy?.length ?? 0})`} items={(selectedFile.importedBy ?? []).map((id) => basename(nodeById.get(id)?.label || id))} empty="Not imported internally" />
                <List title={`Exports (${selectedFile.exports?.length ?? 0})`} items={selectedFile.exports ?? []} empty="No detected exports" />
                <List title={`External packages (${selectedFile.externalPackages?.length ?? 0})`} items={selectedFile.externalPackages ?? []} empty="None" icon />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <div className="text-[10px] uppercase tracking-wider font-bold text-black/50 mb-0.5">{label}</div>
    <div className="font-mono break-all">{children}</div>
  </div>
);

const List = ({ title, items, empty, icon }: { title: string; items: string[]; empty: string; icon?: boolean }) => (
  <div>
    <div className="text-[10px] uppercase tracking-wider font-bold text-black/50 mb-1 flex items-center gap-1">
      {icon ? <Package className="w-3 h-3" /> : <GitMerge className="w-3 h-3" />} {title}
    </div>
    {items.length ? (
      <div className="flex flex-col gap-1">
        {items.map((it, i) => <div key={`${it}-${i}`} className="font-mono bg-black/5 border border-black/10 rounded px-2 py-1 break-all">{it}</div>)}
      </div>
    ) : <div className="italic text-black/40">{empty}</div>}
  </div>
);
