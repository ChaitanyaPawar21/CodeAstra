import { useState, useCallback, useMemo } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  MarkerType,
  Position, 
  Handle,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import type { Connection, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import dagre from 'dagre';
import { mockRepoData } from '../data/mockDashboardData';
import { X, Search, GitMerge, FileCode, AlertTriangle, Activity } from 'lucide-react';
import type { GraphNode as GraphNodeType } from '../types/dashboard';
import { useAnalysis } from '../context/AnalysisContext';

// --- Types & Config ---

const colorMap: Record<string, string> = {
  route: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
  controller: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
  service: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
  model: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
  middleware: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
  config: 'bg-orange-500/10 border-orange-500/30 text-orange-300',
  utility: 'bg-pink-500/10 border-pink-500/30 text-pink-300',
  database: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
  api: 'bg-sky-500/10 border-sky-500/30 text-sky-300',
};

// --- Custom Nodes & Edges ---

const GlowNode = ({ data, selected }: { data: GraphNodeType & { isDimmed: boolean }, selected: boolean }) => {
  const colorClass = colorMap[data.type] || colorMap['utility'];
  const opacity = data.isDimmed ? 'opacity-30' : 'opacity-100';

  return (
    <motion.div 
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: data.isDimmed ? 0.3 : 1 }}
      className={`relative rounded-xl border px-4 py-2.5 backdrop-blur-md transition-all duration-200 ${colorClass} ${opacity} ${selected ? 'ring-2 ring-indigo-400 scale-105 z-50' : 'hover:scale-102 cursor-pointer shadow-sm'}`}
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-transparent !border-none" />
      
      <div className="flex flex-col items-center gap-0.5 min-w-[110px]">
        <span className="text-[9px] uppercase tracking-widest font-mono font-bold opacity-60">{data.type}</span>
        <span className="text-xs font-mono font-medium">{data.label}</span>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-transparent !border-none" />
    </motion.div>
  );
};


const nodeTypes = { custom: GlowNode };

// --- Layout Engine (Dagre) ---

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 200;
  const nodeHeight = 80;

  dagreGraph.setGraph({ rankdir: direction, nodesep: 80, ranksep: 100, edgesep: 30 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = Position.Top;
    node.sourcePosition = Position.Bottom;
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
    return node;
  });

  return { nodes, edges };
};

// --- Main Page Component ---

export default function DependencyGraphPage() {
  const { analysisData } = useAnalysis();
  const rawData = (analysisData || mockRepoData).dependencyGraph;
  
  // Transform mock data to React Flow format
  const initialNodes = useMemo(() => rawData.nodes.map(n => ({
    id: n.id,
    type: 'custom',
    data: { ...n, isDimmed: false },
    position: { x: 0, y: 0 }
  })), [rawData]);

  const initialEdges = useMemo(() => rawData.edges.map((e, idx) => ({
    id: `e${e.source}-${e.target}-${idx}`,
    source: e.source,
    target: e.target,
    animated: e.animated || true,
    label: e.label,
    style: { strokeWidth: 2, stroke: 'rgba(255,255,255,0.2)' },
    markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(255,255,255,0.4)' },
    labelStyle: { fill: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 600, fontFamily: 'monospace' },
    labelBgStyle: { fill: 'rgba(0,0,0,0.5)', fillOpacity: 0.8 },
  })), [rawData]);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(initialNodes, initialEdges),
    [initialNodes, initialEdges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);
  const [selectedNodeData, setSelectedNodeData] = useState<GraphNodeType | null>(null);

  const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onNodeClick = useCallback((_: any, node: any) => {
    const selectedId = node.id;
    setSelectedNodeData(node.data);

    // Dim non-connected nodes & edges
    const connectedNodeIds = new Set<string>();
    connectedNodeIds.add(selectedId);
    
    edges.forEach(e => {
      if (e.source === selectedId) connectedNodeIds.add(e.target);
      if (e.target === selectedId) connectedNodeIds.add(e.source);
    });

    setNodes(nds => nds.map(n => ({
      ...n,
      data: { ...n.data, isDimmed: !connectedNodeIds.has(n.id) }
    })));

    setEdges(eds => eds.map(e => ({
      ...e,
      style: { 
        ...e.style, 
        stroke: e.source === selectedId || e.target === selectedId ? 'rgba(59,130,246,0.8)' : 'rgba(255,255,255,0.05)',
        strokeWidth: e.source === selectedId || e.target === selectedId ? 3 : 1
      },
      markerEnd: { 
        type: MarkerType.ArrowClosed, 
        color: e.source === selectedId || e.target === selectedId ? 'rgba(59,130,246,0.8)' : 'rgba(255,255,255,0.05)' 
      },
      animated: e.source === selectedId || e.target === selectedId
    })));

  }, [edges, setNodes, setEdges]);

  const onPaneClick = useCallback(() => {
    setSelectedNodeData(null);
    setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, isDimmed: false } })));
    setEdges(eds => eds.map(e => ({
      ...e,
      style: { strokeWidth: 2, stroke: 'rgba(255,255,255,0.2)' },
      markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(255,255,255,0.4)' },
      animated: true
    })));
  }, [setNodes, setEdges]);

  return (
    <div className="h-[calc(100vh-80px)] w-full flex bg-[#0A0D14] relative overflow-hidden rounded-xl border border-white/5 shadow-2xl">
      
      {/* Top Bar / Search (Placeholder) */}
      <div className="absolute top-4 left-4 z-10 flex gap-4">
        <div className="bg-[#141824]/80 backdrop-blur-md border border-white/10 rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg">
          <Search className="w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search nodes..." 
            className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 w-48 font-mono"
          />
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.5 }}
        minZoom={0.1}
        maxZoom={2}
        className="bg-transparent"
      >
        <Background color="rgba(255, 255, 255, 0.05)" gap={24} size={1.5} />
        <Controls className="bg-[#141824]/80 border border-white/10 fill-white !p-1 !rounded-lg" />
        <MiniMap 
          className="bg-[#141824]/80 border border-white/10 !rounded-lg overflow-hidden" 
          nodeColor={(n: any) => colorMap[n.data.type]?.includes('blue') ? '#3b82f6' : '#a855f7'}
          maskColor="rgba(0, 0, 0, 0.6)"
        />
      </ReactFlow>

      {/* Node Details Side Panel */}
      <AnimatePresence>
        {selectedNodeData && selectedNodeData.metadata && (
          <motion.div 
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-4 right-4 bottom-4 w-80 bg-[#1E2330]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col z-20 overflow-hidden"
          >
            {/* Header */}
            <div className={`p-5 border-b border-white/10 bg-gradient-to-b ${colorMap[selectedNodeData.type].split(' ')[0]} to-transparent relative`}>
              <button 
                onClick={onPaneClick}
                className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-md transition-colors text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="text-[10px] uppercase tracking-widest font-bold text-white/70 mb-1">{selectedNodeData.type}</div>
              <div className="text-lg font-bold text-white font-mono leading-tight">{selectedNodeData.label}</div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 overflow-y-auto space-y-6 scrollbar-hide">
              
              {/* Summary */}
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider"><FileCode className="w-3.5 h-3.5" /> AI Summary</div>
                <p className="text-xs text-gray-300 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">
                  {selectedNodeData.metadata.aiSummary}
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/20 border border-white/5 p-3 rounded-lg flex flex-col gap-1">
                  <div className="text-[10px] text-gray-500 uppercase flex items-center gap-1.5"><Activity className="w-3 h-3" /> Complexity</div>
                  <div className="text-xl font-bold text-white">{selectedNodeData.metadata.complexityScore}</div>
                </div>
                <div className="bg-black/20 border border-white/5 p-3 rounded-lg flex flex-col gap-1">
                  <div className="text-[10px] text-gray-500 uppercase flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" /> Risk</div>
                  <div className={`text-sm font-bold mt-1 ${selectedNodeData.metadata.riskLevel === 'Critical' ? 'text-red-400' : selectedNodeData.metadata.riskLevel === 'High' ? 'text-orange-400' : 'text-green-400'}`}>
                    {selectedNodeData.metadata.riskLevel}
                  </div>
                </div>
              </div>

              {/* Dependencies */}
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider"><GitMerge className="w-3.5 h-3.5" /> Dependencies ({selectedNodeData.metadata.dependencies.length})</div>
                <div className="flex flex-col gap-1.5">
                  {selectedNodeData.metadata.dependencies.length > 0 ? selectedNodeData.metadata.dependencies.map(dep => (
                    <div key={dep} className="text-[11px] font-mono text-gray-300 bg-white/5 px-2.5 py-1.5 rounded-md border border-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                      {dep}
                    </div>
                  )) : <div className="text-[11px] text-gray-500 italic">No external dependencies</div>}
                </div>
              </div>

              {/* Imported By */}
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider"><GitMerge className="w-3.5 h-3.5" /> Imported By ({selectedNodeData.metadata.importedBy.length})</div>
                <div className="flex flex-col gap-1.5">
                  {selectedNodeData.metadata.importedBy.length > 0 ? selectedNodeData.metadata.importedBy.map(imp => (
                    <div key={imp} className="text-[11px] font-mono text-gray-300 bg-white/5 px-2.5 py-1.5 rounded-md border border-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                      {imp}
                    </div>
                  )) : <div className="text-[11px] text-gray-500 italic">Not imported elsewhere</div>}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
