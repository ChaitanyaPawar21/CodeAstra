import React, { useMemo } from 'react';
import { MoreVertical, ChevronDown, Terminal, BookOpen, Layers, Zap, Code2, ArrowUpRight, Copy, CheckCircle2 } from 'lucide-react';
import { mockRepoData } from '../data/mockDashboardData';
import { ReactFlow, Background, MarkerType, Position, Handle } from '@xyflow/react';
import type { Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import dagre from 'dagre';
import { useAnalysis } from '../context/AnalysisContext';

// Custom Node for React Flow
const CustomNode = ({ data }: { data: any }) => {
  return (
    <>
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-transparent !border-none" />
      <div className={`px-3 py-1.5 rounded-lg border text-[11px] font-mono whitespace-nowrap shadow-sm backdrop-blur-md transition-all duration-200 hover:scale-105 cursor-pointer ${data.className}`}>
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-transparent !border-none" />
    </>
  );
};
const nodeTypes = { custom: CustomNode };

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 140;
  const nodeHeight = 36;

  dagreGraph.setGraph({ rankdir: direction, nodesep: 40, ranksep: 40 });

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

export default function DashboardPage() {
  const navigate = useNavigate();
  const { analysisData } = useAnalysis();
  const data = analysisData || mockRepoData;

  // React Flow configuration
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    if (!data.dependencyGraph) return { nodes: [], edges: [] };
    
    const initialNodes: Node[] = data.dependencyGraph.nodes.map(n => {
      const colorMap: Record<string, string> = {
        blue: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:border-indigo-400',
        purple: 'bg-purple-500/10 text-purple-300 border-purple-500/30 hover:border-purple-400',
        yellow: 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:border-amber-400',
        green: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:border-emerald-400',
      };
      return {
        id: n.id,
        type: 'custom',
        data: { label: n.label, className: colorMap[n.color] || 'bg-slate-800 text-slate-300 border-slate-700' },
        position: { x: 0, y: 0 }
      };
    });

    const initialEdges: Edge[] = data.dependencyGraph.edges.map(e => ({
      id: `${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      animated: true,
      type: 'smoothstep',
      style: { stroke: 'rgba(99, 102, 241, 0.4)', strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(99, 102, 241, 0.4)' }
    }));

    return getLayoutedElements(initialNodes, initialEdges, 'TB');
  }, [data.dependencyGraph]);

  // Framer Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <div className="h-full flex gap-6 overflow-hidden text-slate-300">
      
      {/* Main Content Area */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex-1 overflow-y-auto pr-1 scrollbar-hide pb-6"
      >
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-[1800px] mx-auto">
            
            {/* ROW 1 */}
            {/* Summary Card */}
            <motion.div variants={itemVariants} className="col-span-1 lg:col-span-8 bg-[#12141C] rounded-2xl border border-white/[0.07] p-6 flex flex-col justify-between shadow-lg hover:border-white/[0.12] transition-all">
               <div>
                  <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 font-bold text-lg">
                           ⚛
                        </div>
                        <div>
                           <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{data.summary.title}</h1>
                           <p className="text-xs text-slate-400">Repository Architecture Summary</p>
                        </div>
                     </div>
                     <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Analyzed
                     </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                     {data.summary.techStack.map(tech => (
                        <span key={tech.name} className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-slate-900 text-slate-300 border border-white/[0.08]">
                           {tech.name}
                        </span>
                     ))}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 px-5 rounded-xl bg-[#090A0F] border border-white/[0.05] mb-6">
                     <div>
                        <div className="text-[11px] font-mono text-slate-400 mb-0.5">TOTAL FILES</div>
                        <div className="text-xl font-bold text-white tracking-tight">{data.summary.totalFiles}</div>
                     </div>
                     <div>
                        <div className="text-[11px] font-mono text-slate-400 mb-0.5">COMPLEXITY</div>
                        <div className="text-xl font-bold text-indigo-400 tracking-tight">{data.summary.complexity}</div>
                     </div>
                     <div>
                        <div className="text-[11px] font-mono text-slate-400 mb-0.5">FRAMEWORK</div>
                        <div className="text-xl font-bold text-white tracking-tight">React 18</div>
                     </div>
                     <div>
                        <div className="text-[11px] font-mono text-slate-400 mb-0.5">BUILD TOOL</div>
                        <div className="text-xl font-bold text-white tracking-tight">Vite</div>
                     </div>
                  </div>
               </div>

               <div className="flex flex-col md:flex-row gap-6 border-t border-white/[0.06] pt-4">
                  <ul className="text-xs space-y-1.5 text-slate-400 list-disc list-inside flex-1">
                     {data.summary.bulletPoints.map((bp, i) => <li key={i}>{bp}</li>)}
                  </ul>
                  <p className="text-xs text-slate-400 leading-relaxed flex-1">
                     {data.summary.description}
                  </p>
               </div>
            </motion.div>

            {/* Repository Overview */}
            <motion.div variants={itemVariants} className="col-span-1 lg:col-span-4 bg-[#12141C] rounded-2xl border border-white/[0.07] p-6 flex flex-col shadow-lg hover:border-white/[0.12] transition-all">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                     <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                        <BookOpen className="w-4 h-4" />
                     </div>
                     <div>
                        <h2 className="text-sm font-semibold text-white">Repository Overview</h2>
                        <div className="text-xs text-slate-400 font-mono">{data.repositoryOverview.name}</div>
                     </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono uppercase">
                     {data.repositoryOverview.category}
                  </span>
               </div>
               
               <p className="text-xs text-slate-300 leading-relaxed mb-6 bg-[#090A0F] p-3.5 rounded-xl border border-white/[0.05]">
                  {data.repositoryOverview.description}
               </p>

               <div className="grid grid-cols-2 gap-4 mt-auto">
                  <div className="space-y-2">
                     <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                        <Code2 className="w-3 h-3 text-indigo-400" /> Tech Stack
                     </div>
                     <div className="flex flex-wrap gap-1">
                        {data.repositoryOverview.technologies.map(tech => (
                           <span key={tech} className="px-2 py-0.5 rounded bg-slate-900 text-[10px] font-mono text-slate-300 border border-white/[0.06]">
                              {tech}
                           </span>
                        ))}
                     </div>
                  </div>
                  
                  <div className="space-y-2">
                     <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                        <Layers className="w-3 h-3 text-purple-400" /> Architecture
                     </div>
                     <div className="flex flex-wrap gap-1">
                        {data.repositoryOverview.architectures.map(arch => (
                           <span key={arch} className="px-2 py-0.5 rounded bg-slate-900 text-[10px] font-mono text-slate-300 border border-white/[0.06]">
                              {arch}
                           </span>
                        ))}
                     </div>
                  </div>
               </div>
            </motion.div>

            {/* ROW 2 */}
            {/* Quick Setup Guide */}
            <motion.div variants={itemVariants} className="col-span-1 lg:col-span-4 bg-[#12141C] rounded-2xl border border-white/[0.07] p-6 flex flex-col h-full min-h-[320px] shadow-lg hover:border-white/[0.12] transition-all">
               <div className="flex items-center gap-2 mb-1">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-semibold text-sm text-white">Quick Setup Guide</h3>
               </div>
               <p className="text-xs text-slate-400 mb-5">Automated setup commands & requirements</p>
               
               <div className="flex-1 flex flex-col gap-4">
                  <div>
                     <div className="text-[10px] font-mono font-bold text-slate-400 mb-2 uppercase tracking-wider">Required Technologies</div>
                     <div className="flex flex-wrap gap-1.5">
                        {data.quickSetupGuide.techStack.map(tech => (
                           <span key={tech} className="px-2.5 py-1 rounded-md bg-[#090A0F] border border-white/[0.06] text-xs font-mono text-slate-300">
                              {tech}
                           </span>
                        ))}
                     </div>
                  </div>

                  <div>
                     <div className="text-[10px] font-mono font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Installation</div>
                     <div className="bg-[#090A0F] border border-white/[0.06] rounded-xl p-3 flex items-center justify-between group cursor-pointer hover:border-indigo-500/30 transition-all">
                        <code className="text-xs text-indigo-300 font-mono">{data.quickSetupGuide.installCommand}</code>
                        <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
                     </div>
                  </div>

                  <div>
                     <div className="text-[10px] font-mono font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Run Dev Server</div>
                     <div className="bg-[#090A0F] border border-white/[0.06] rounded-xl p-3 flex items-center justify-between group cursor-pointer hover:border-emerald-500/30 transition-all">
                        <code className="text-xs text-emerald-300 font-mono">{data.quickSetupGuide.runCommand}</code>
                        <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
                     </div>
                  </div>
               </div>
            </motion.div>

            {/* Entry Point Detection */}
            <motion.div variants={itemVariants} className="col-span-1 lg:col-span-4 bg-[#12141C] rounded-2xl border border-white/[0.07] p-6 flex flex-col h-full min-h-[320px] shadow-lg hover:border-white/[0.12] transition-all">
               <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h3 className="font-semibold text-sm text-white">Entry Point Detection</h3>
               </div>
               <p className="text-xs text-slate-400 mb-5">Execution pipeline visualization</p>
               
               <div className="flex flex-col items-center flex-1 justify-center py-2 w-full">
                  {data.entryPoints.map((step, i) => (
                     <React.Fragment key={i}>
                        <div className="w-full max-w-[240px]">
                           {i === 0 ? (
                              <div className="px-4 py-2 rounded-xl bg-indigo-600/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono text-center font-semibold shadow-sm flex items-center justify-between">
                                 <span>{step.label}</span>
                                 <span className="text-[9px] bg-indigo-500/20 px-1.5 py-0.5 rounded uppercase">Entry</span>
                              </div>
                           ) : (
                              <div className="px-4 py-2 rounded-xl bg-[#090A0F] border border-white/[0.06] text-slate-300 text-xs font-mono text-center">
                                 {step.label}
                              </div>
                           )}
                        </div>
                        
                        {i < data.entryPoints.length - 1 && (
                           <div className="h-5 w-px bg-white/10 flex items-center justify-center my-1">
                              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                           </div>
                        )}
                     </React.Fragment>
                  ))}
               </div>
            </motion.div>

            {/* Dependency Graph */}
            <motion.div variants={itemVariants} className="col-span-1 lg:col-span-4 bg-[#12141C] rounded-2xl border border-white/[0.07] p-6 flex flex-col h-full min-h-[320px] shadow-lg hover:border-white/[0.12] transition-all">
               <div className="flex justify-between items-center mb-1">
                  <h3 className="font-semibold text-sm text-white">Dependency Graph</h3>
                  <button 
                     onClick={() => navigate('/graph')}
                     className="px-2.5 py-1 text-xs font-medium text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-md border border-indigo-500/20 transition-all flex items-center gap-1"
                  >
                     Expand <ArrowUpRight className="w-3 h-3" />
                  </button>
               </div>
               <p className="text-xs text-slate-400 mb-3">Interactive module relationships</p>
               
               <div className="flex-1 bg-[#090A0F] rounded-xl border border-white/[0.06] relative overflow-hidden flex flex-col shadow-inner w-full min-h-[180px]">
                  <div className="flex-1 w-full h-full cursor-pointer" onClick={() => navigate('/graph')}>
                    {layoutedNodes.length > 0 && (
                      <ReactFlow
                        nodes={layoutedNodes}
                        edges={layoutedEdges}
                        nodeTypes={nodeTypes}
                        fitView
                        fitViewOptions={{ padding: 0.2 }}
                        className="bg-transparent pointer-events-none"
                        panOnDrag={false}
                        zoomOnScroll={false}
                        zoomOnPinch={false}
                        zoomOnDoubleClick={false}
                        nodesDraggable={false}
                      >
                        <Background color="rgba(255, 255, 255, 0.04)" gap={16} size={1} />
                      </ReactFlow>
                    )}
                  </div>
               </div>
            </motion.div>

            {/* ROW 3 */}
            {/* Critical Files */}
            <motion.div variants={itemVariants} className="col-span-1 lg:col-span-6 bg-[#12141C] rounded-2xl border border-white/[0.07] p-6 flex flex-col shadow-lg hover:border-white/[0.12] transition-all">
               <h3 className="font-semibold text-sm mb-1 text-white">Critical Files</h3>
               <p className="text-xs text-slate-400 mb-5">High impact codebase files needing developer attention</p>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full flex-1">
                  {data.criticalFiles.map((file, i) => {
                     const riskPill = file.riskLevel === 'High' 
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : file.riskLevel === 'Medium'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

                     return (
                        <div key={i} className="rounded-xl bg-[#090A0F] border border-white/[0.06] p-4 flex flex-col justify-between hover:border-white/[0.12] transition-all">
                           <div className="flex items-start justify-between mb-3">
                              <span className="text-xs font-mono font-semibold text-white break-all">{file.name}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${riskPill}`}>
                                 {file.riskLevel} Risk
                              </span>
                           </div>
                           <p className="text-xs text-slate-400 leading-normal mb-3">
                              {file.importance}
                           </p>
                           <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-white/[0.04]">
                              <span>Status: Verified</span>
                              <span className="text-indigo-400">View code &rarr;</span>
                           </div>
                        </div>
                     );
                  })}
               </div>
            </motion.div>

            {/* End-to-end Request Lifecycle */}
            <motion.div variants={itemVariants} className="col-span-1 lg:col-span-6 bg-[#12141C] rounded-2xl border border-white/[0.07] p-6 flex flex-col shadow-lg hover:border-white/[0.12] transition-all">
               <h3 className="font-semibold text-sm mb-1 text-white">Request Lifecycle</h3>
               <p className="text-xs text-slate-400 mb-6">Runtime client-to-database execution pipeline</p>
               
               <div className="flex-1 flex items-center justify-between bg-[#090A0F] p-4 rounded-xl border border-white/[0.06] overflow-x-auto scrollbar-hide">
                  {data.requestLifecycle.map((step, i) => (
                     <React.Fragment key={i}>
                        <div className="flex flex-col items-center gap-2 min-w-[70px]">
                           <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/[0.08] flex items-center justify-center text-indigo-400 shadow-sm">
                              {step.iconType === 'client' && <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />}
                              {step.iconType === 'code' && <div className="font-mono text-xs font-bold">&lt;/&gt;</div>}
                              {step.iconType === 'server' && <div className="w-3.5 h-3 border-2 border-current rounded-sm" />}
                              {step.iconType === 'database' && <div className="w-3.5 h-3.5 border-2 border-current rounded-sm flex items-center justify-center"><div className="w-full h-px bg-current" /></div>}
                              {step.iconType === 'response' && <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent -rotate-45" />}
                           </div>
                           <span className="text-[10px] font-mono text-slate-300 text-center leading-tight">
                              {step.label}
                           </span>
                        </div>

                        {i < data.requestLifecycle.length - 1 && (
                           <div className="h-px flex-1 bg-white/10 mx-2 min-w-[20px]"></div>
                        )}
                     </React.Fragment>
                  ))}
               </div>
            </motion.div>

         </div>
      </motion.div>

      {/* Right Sidebar - AI Insights */}
      <motion.div 
        initial={{ opacity: 0, x: 15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="w-[300px] bg-[#12141C] rounded-2xl border border-white/[0.07] flex flex-col shrink-0 overflow-hidden shadow-lg"
      >
         <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-[#090A0F]">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">AI Insights</h3>
            <MoreVertical className="w-4 h-4 text-slate-500" />
         </div>
         
         <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
            {data.aiInsights.map((insight, i) => (
               <div 
                  key={i} 
                  className="p-3.5 rounded-xl bg-[#090A0F] border border-white/[0.05] hover:border-white/[0.12] transition-all cursor-pointer"
               >
                  <h4 className="text-xs font-semibold text-white leading-snug mb-1.5">
                     {insight.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                     {insight.description}
                  </p>
               </div>
            ))}
         </div>
      </motion.div>

    </div>
  );
}


