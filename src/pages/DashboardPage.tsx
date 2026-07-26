import React, { useMemo } from 'react';
import { MoreVertical, ChevronDown, Terminal, BookOpen, Layers, Cpu, Zap, Code2 } from 'lucide-react';
import { mockRepoData } from '../data/mockDashboardData';
import { ReactFlow, Background, MarkerType, Position, Handle } from '@xyflow/react';
import type { Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import dagre from 'dagre';

// Custom Node for React Flow
const CustomNode = ({ data }: { data: any }) => {
  return (
    <>
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-transparent !border-none" />
      <div className={`px-4 py-2 rounded-full border text-[10px] whitespace-nowrap shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-110 hover:shadow-xl cursor-pointer ${data.className}`}>
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

  const nodeWidth = 150;
  const nodeHeight = 40;

  dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 50 });

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
  const data = mockRepoData;

  // React Flow configuration
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    if (!data.dependencyGraph) return { nodes: [], edges: [] };
    
    const initialNodes: Node[] = data.dependencyGraph.nodes.map(n => {
      const colorMap: Record<string, string> = {
        blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]',
        purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30 hover:border-purple-400 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]',
        yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:border-yellow-400 hover:shadow-[0_0_15px_rgba(234,179,8,0.3)]',
        green: 'bg-green-500/20 text-green-400 border-green-500/30 hover:border-green-400 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]',
      };
      return {
        id: n.id,
        type: 'custom',
        data: { label: n.label, className: colorMap[n.color] || 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
        position: { x: 0, y: 0 }
      };
    });

    const initialEdges: Edge[] = data.dependencyGraph.edges.map(e => ({
      id: `${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      animated: true,
      type: 'smoothstep',
      style: { stroke: 'rgba(96, 165, 250, 0.4)', strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(96, 165, 250, 0.4)' }
    }));

    return getLayoutedElements(initialNodes, initialEdges, 'TB');
  }, [data.dependencyGraph]);

  // Framer Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="h-full flex gap-6 overflow-hidden text-gray-300">
      
      {/* Main Content Area */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex-1 overflow-y-auto pr-2 scrollbar-hide pb-6"
      >
         {/* Stable 12-column grid system */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-[1800px] mx-auto">
            
            {/* ROW 1 */}
            {/* Summary Card */}
            <motion.div variants={itemVariants} className="col-span-1 lg:col-span-8 bg-[#1E2330]/80 backdrop-blur-xl rounded-xl border border-white/5 p-6 flex flex-col relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
               <div className="absolute top-4 right-4 text-[10px] font-mono text-gray-500 bg-[#2A3143] px-1.5 rounded">B3</div>
               <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  AI Genestory Summary
               </h2>
               
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 text-xl shadow-[0_0_15px_rgba(59,130,246,0.15)] shrink-0">⚛</div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">{data.summary.title}</h1>
               </div>
               
               <div className="flex flex-wrap gap-2 mb-8">
                  {data.summary.techStack.map(tech => (
                     <span key={tech.name} className={`px-3 py-1.5 rounded-md text-[11px] font-medium border shadow-sm ${tech.color}`}>
                        {tech.name}
                     </span>
                  ))}
               </div>

               <div className="flex flex-wrap gap-10 mb-8">
                  <div>
                     <div className="text-xs text-gray-500 mb-1">Total files analyzed</div>
                     <div className="text-3xl font-bold text-white tracking-tight">{data.summary.totalFiles}</div>
                  </div>
                  <div>
                     <div className="text-xs text-gray-500 mb-1">Estimated complexity</div>
                     <div className="text-3xl font-bold text-yellow-500 border-b-2 border-yellow-500/50 inline-block pb-0.5 tracking-tight">{data.summary.complexity}</div>
                  </div>
               </div>

               <div className="flex flex-col lg:flex-row gap-8 mt-auto border-t border-white/5 pt-5">
                  <ul className="text-xs space-y-2 text-gray-400 list-disc list-inside flex-1">
                     {data.summary.bulletPoints.map((bp, i) => <li key={i}>{bp}</li>)}
                  </ul>
                  <p className="text-xs text-gray-400 leading-relaxed flex-1">
                     {data.summary.description}
                  </p>
               </div>
            </motion.div>

            {/* Repository Overview */}
            <motion.div variants={itemVariants} className="col-span-1 lg:col-span-4 bg-[#1E2330]/80 backdrop-blur-xl rounded-xl border border-white/5 p-6 flex flex-col relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 min-h-[300px]">
               <div className="absolute top-4 right-4 flex items-center gap-2">
                  <div className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20 uppercase tracking-wider flex items-center gap-1">
                     <Zap className="w-3 h-3" /> AI Generated
                  </div>
               </div>
               
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)] shrink-0">
                     <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                     <h2 className="text-sm font-semibold text-white">Repository Overview</h2>
                     <div className="text-xs text-gray-500">{data.repositoryOverview.name}</div>
                  </div>
               </div>

               <div className="mb-4">
                  <span className="inline-block px-2.5 py-1 rounded bg-[#2A3143]/80 border border-white/5 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                     {data.repositoryOverview.category}
                  </span>
               </div>
               
               <p className="text-xs text-gray-300 leading-relaxed mb-6 bg-black/20 p-4 rounded-lg border border-white/5">
                  {data.repositoryOverview.description}
               </p>

               <div className="grid grid-cols-2 gap-4 mt-auto">
                  {/* Tech Stack */}
                  <div className="space-y-2">
                     <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <Code2 className="w-3 h-3" /> Tech Stack
                     </div>
                     <div className="flex flex-wrap gap-1.5">
                        {data.repositoryOverview.technologies.slice(0, 3).map(tech => (
                           <span key={tech} className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] text-gray-400">
                              {tech}
                           </span>
                        ))}
                        {data.repositoryOverview.technologies.length > 3 && (
                           <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] text-gray-400">
                              +{data.repositoryOverview.technologies.length - 3}
                           </span>
                        )}
                     </div>
                  </div>
                  
                  {/* Architecture */}
                  <div className="space-y-2">
                     <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <Layers className="w-3 h-3" /> Architecture
                     </div>
                     <div className="flex flex-wrap gap-1.5">
                        {data.repositoryOverview.architectures.slice(0, 2).map(arch => (
                           <span key={arch} className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] text-gray-400">
                              {arch}
                           </span>
                        ))}
                     </div>
                  </div>
               </div>
            </motion.div>

            {/* ROW 2 */}
            {/* Quick Setup Guide */}
            <motion.div variants={itemVariants} className="col-span-1 lg:col-span-4 bg-[#1E2330]/80 backdrop-blur-xl rounded-xl border border-white/5 p-6 flex flex-col relative h-full min-h-[360px] shadow-lg hover:shadow-xl transition-all duration-300">
               <div className="absolute top-4 right-4 text-[10px] font-mono text-gray-500 bg-[#2A3143] px-1.5 rounded">M1</div>
               <h3 className="font-semibold text-sm mb-1 text-white">Quick Setup Guide</h3>
               <p className="text-xs text-gray-500 mb-5">AI-generated onboarding & setup instructions</p>
               
               <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide flex flex-col gap-5">
                  
                  {/* Tech Stack */}
                  <div>
                     <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Required Technologies</div>
                     <div className="flex flex-wrap gap-2">
                        {data.quickSetupGuide.techStack.map(tech => (
                           <span key={tech} className="px-2.5 py-1 rounded bg-[#2A3143]/60 border border-white/5 text-[11px] text-gray-300">
                              {tech}
                           </span>
                        ))}
                     </div>
                  </div>

                  {/* Installation */}
                  <div>
                     <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Installation</div>
                     <div className="bg-[#141824] border border-white/5 rounded-lg p-3 flex items-center justify-between group cursor-pointer hover:border-blue-500/30 transition-colors">
                        <div className="flex items-center gap-3">
                           <Terminal className="w-4 h-4 text-blue-400" />
                           <code className="text-[11px] text-gray-300 font-mono">{data.quickSetupGuide.installCommand}</code>
                        </div>
                        <div className="text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">Copy</div>
                     </div>
                  </div>

                  {/* Run Command */}
                  <div>
                     <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Run Locally</div>
                     <div className="bg-[#141824] border border-white/5 rounded-lg p-3 flex items-center justify-between group cursor-pointer hover:border-green-500/30 transition-colors">
                        <div className="flex items-center gap-3">
                           <Terminal className="w-4 h-4 text-green-400" />
                           <code className="text-[11px] text-gray-300 font-mono">{data.quickSetupGuide.runCommand}</code>
                        </div>
                        <div className="text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">Copy</div>
                     </div>
                  </div>

               </div>
            </motion.div>

            {/* Entry Point Detection */}
            <motion.div variants={itemVariants} className="col-span-1 lg:col-span-4 bg-[#1E2330]/80 backdrop-blur-xl rounded-xl border border-white/5 p-6 flex flex-col relative h-full min-h-[360px] shadow-lg hover:shadow-xl transition-all duration-300">
               <div className="absolute top-4 right-4 text-[10px] font-mono text-gray-500 bg-[#2A3143] px-1.5 rounded">M2</div>
               <h3 className="font-semibold text-sm mb-1 text-white">Entry Point Detection</h3>
               <p className="text-xs text-gray-500 mb-4">Execution pipeline visualization</p>
               
               <div className="flex flex-col items-center flex-1 relative overflow-hidden justify-center py-2 w-full">
                  {data.entryPoints.map((step, i) => (
                     <React.Fragment key={i}>
                        <motion.div 
                           initial={{ opacity: 0, scale: 0.95 }}
                           animate={{ opacity: 1, scale: 1 }}
                           transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
                           className={`flex flex-col items-center w-full max-w-[200px] relative z-10`}
                        >
                           {i === 0 ? (
                              <div className="px-5 py-2 w-full rounded-full bg-[#313B6B] border border-blue-500/50 text-blue-300 text-xs text-center font-semibold shadow-[0_0_15px_rgba(59,130,246,0.2)] tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">
                                 {step.label}
                              </div>
                           ) : (
                              <div className="px-4 py-2 w-full rounded-lg bg-[#2A3143] border border-white/5 text-gray-300 text-[10.5px] text-center hover:bg-white/10 transition-colors cursor-default shadow-sm whitespace-nowrap overflow-hidden text-ellipsis">
                                 {step.label}
                              </div>
                           )}
                        </motion.div>
                        
                        {i < data.entryPoints.length - 1 && (
                           <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 24 }}
                              transition={{ delay: i * 0.1 + 0.1 }}
                              className="w-[2px] bg-gradient-to-b from-blue-500/40 to-blue-500/10 flex flex-col items-center justify-end my-1 overflow-visible"
                           >
                              <ChevronDown className="w-3.5 h-3.5 text-blue-400/80 -mb-2" />
                           </motion.div>
                        )}
                     </React.Fragment>
                  ))}
               </div>
            </motion.div>

            {/* Dependency Graph */}
            <motion.div variants={itemVariants} className="col-span-1 lg:col-span-4 bg-[#1E2330]/80 backdrop-blur-xl rounded-xl border border-white/5 p-6 flex flex-col relative h-full min-h-[360px] shadow-lg hover:shadow-xl transition-all duration-300">
               <div className="flex justify-between items-start mb-1 z-20 relative">
                  <div>
                     <div className="absolute top-0 right-0 text-[10px] font-mono text-gray-500 bg-[#2A3143] px-1.5 rounded">M3</div>
                     <h3 className="font-semibold text-sm text-white">Dependency Graph</h3>
                  </div>
                  <button 
                     onClick={() => navigate('/graph')}
                     className="px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-md border border-blue-500/20 transition-colors"
                  >
                     Expand
                  </button>
               </div>
               <p className="text-xs text-gray-500 mb-3 z-20">Interactive dependency visual</p>
               
               <div className="flex-1 bg-[#141824]/50 rounded-xl border border-white/5 relative overflow-hidden flex flex-col shadow-inner w-full min-h-[200px]">
                  {/* Legend */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 text-[9px] text-gray-400 z-10 bg-black/20 p-2 rounded-lg backdrop-blur-sm border border-white/5">
                     <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.8)]"></span> Routes</div>
                     <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.8)]"></span> Controllers</div>
                     <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]"></span> Services</div>
                     <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.8)]"></span> Models</div>
                  </div>
                  
                  {/* React Flow Graph */}
                  <div className="flex-1 w-full h-full cursor-pointer" onClick={() => navigate('/graph')}>
                    {layoutedNodes.length > 0 && (
                      <ReactFlow
                        nodes={layoutedNodes}
                        edges={layoutedEdges}
                        nodeTypes={nodeTypes}
                        fitView
                        fitViewOptions={{ padding: 0.2 }}
                        minZoom={0.5}
                        maxZoom={1.5}
                        className="bg-transparent pointer-events-none"
                        panOnDrag={false}
                        zoomOnScroll={false}
                        zoomOnPinch={false}
                        zoomOnDoubleClick={false}
                        nodesDraggable={false}
                      >
                        <Background color="rgba(255, 255, 255, 0.05)" gap={16} size={1} />
                      </ReactFlow>
                    )}
                  </div>
               </div>
            </motion.div>

            {/* ROW 3 */}
            {/* Critical Files */}
            <motion.div variants={itemVariants} className="col-span-1 lg:col-span-6 bg-[#1E2330]/80 backdrop-blur-xl rounded-xl border border-white/5 p-6 flex flex-col relative h-full min-h-[300px] overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
               <div className="absolute top-4 right-4 text-[10px] font-mono text-gray-500 bg-[#2A3143] px-1.5 rounded">B1</div>
               <h3 className="font-semibold text-sm mb-1 text-white">Critical Files</h3>
               <p className="text-xs text-gray-500 mb-5">Premium analytics cards glow highlights</p>
               
               {/* Responsive Auto-Fit Grid to prevent overflow */}
               <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4 w-full flex-1">
                  {data.criticalFiles.map((file, i) => {
                     const themeColors: Record<string, string> = {
                        blue: 'from-[#1E3A8A]/60 to-[#172554]/60 border-blue-500/40 text-blue-400 shadow-[0_0_20px_rgba(30,58,138,0.2)] hover:shadow-[0_0_25px_rgba(59,130,246,0.3)]',
                        yellow: 'from-[#78350F]/60 to-[#451A03]/60 border-yellow-500/40 text-yellow-400 shadow-[0_0_20px_rgba(120,53,15,0.2)] hover:shadow-[0_0_25px_rgba(234,179,8,0.3)]',
                        red: 'from-[#7F1D1D]/60 to-[#450A0A]/60 border-red-500/40 text-red-400 shadow-[0_0_20px_rgba(127,29,29,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.3)]',
                        purple: 'from-[#4C1D95]/60 to-[#2E1065]/60 border-purple-500/40 text-purple-400 shadow-[0_0_20px_rgba(76,29,149,0.2)] hover:shadow-[0_0_25px_rgba(168,85,247,0.3)]'
                     };
                     const colorClass = themeColors[file.colorTheme];

                     return (
                        <div key={i} className={`rounded-xl bg-gradient-to-b ${colorClass} border p-4 flex flex-col relative transition-all duration-300 cursor-pointer min-h-[140px] h-full`}>
                           {file.isStarred && <StarIcon className="absolute top-3.5 right-3.5 text-yellow-500 shrink-0" />}
                           <div className="text-xs font-semibold text-white mb-4 break-words pr-5 leading-tight">{file.name}</div>
                           <div className="mt-auto space-y-3">
                              <div>
                                 <div className="text-[9px] font-bold text-white/70 uppercase tracking-wider mb-0.5">Importance</div>
                                 <div className="text-[10px] text-white/60">{file.importance}</div>
                              </div>
                              <div className="w-5 border-t border-white/20"></div>
                              <div>
                                 <div className="text-[9px] font-bold text-white/70 uppercase tracking-wider mb-0.5">Risk level</div>
                                 <div className="text-[10px] text-white/60">{file.riskLevel}</div>
                              </div>
                           </div>
                        </div>
                     );
                  })}
               </div>
            </motion.div>

            {/* End-to-end Request Lifecycle */}
            <motion.div variants={itemVariants} className="col-span-1 lg:col-span-6 bg-[#1E2330]/80 backdrop-blur-xl rounded-xl border border-white/5 p-6 flex flex-col relative h-full min-h-[300px] overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
               <div className="absolute top-4 right-4 text-[10px] font-mono text-gray-500 bg-[#2A3143] px-1.5 rounded">B2</div>
               <h3 className="font-semibold text-sm mb-1 text-white">End-to-end Request Lifecycle</h3>
               <p className="text-xs text-gray-500 mb-8">Runtime Execution Flow visualization</p>
               
               <div className="flex-1 flex flex-col justify-center overflow-x-auto scrollbar-hide w-full py-4">
                  <div className="flex items-center justify-between min-w-[500px] px-4 mx-auto w-full max-w-2xl relative">
                     {/* Background Connection Line for whole width */}
                     <div className="absolute top-6 left-12 right-12 h-0.5 bg-gradient-to-r from-blue-500/50 to-purple-500/50 -z-10 rounded-full"></div>
                     
                     {data.requestLifecycle.map((step, i) => (
                        <div key={i} className="flex flex-col items-center gap-4 relative z-10 w-16 shrink-0">
                           {/* Icon Box */}
                           <motion.div 
                             whileHover={{ scale: 1.1 }}
                             className="w-12 h-12 rounded-xl bg-[#313B6B] border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)] cursor-pointer transition-colors hover:bg-[#313B6B]/80 z-10"
                           >
                              {step.iconType === 'client' && <div className="w-4 h-4 rounded-full border-2 border-current" />}
                              {step.iconType === 'code' && <div className="font-mono text-xs font-bold">&lt;/&gt;</div>}
                              {step.iconType === 'server' && <div className="w-4 h-3.5 border-2 border-current rounded-sm" />}
                              {step.iconType === 'database' && <div className="w-4 h-4 border-2 border-current rounded-sm flex items-center justify-center"><div className="w-full h-px bg-current" /></div>}
                              {step.iconType === 'response' && <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent -rotate-45" />}
                           </motion.div>
                           <div className="text-[10px] font-medium text-gray-300 text-center leading-tight min-h-[24px]">
                              {step.label}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </motion.div>

         </div>
      </motion.div>

      {/* Right Sidebar - AI Insights */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-[320px] bg-[#1E2330]/80 backdrop-blur-xl rounded-xl border border-white/5 flex flex-col shrink-0 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
      >
         <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/10">
            <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase">AI Insights</h3>
            <MoreVertical className="w-4 h-4 text-gray-500 cursor-pointer hover:text-white transition-colors" />
         </div>
         
         <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide">
            {data.aiInsights.map((insight, i) => {
               const iconColors: Record<string, string> = {
                  blue: 'text-blue-400 bg-blue-500/15 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]',
                  red: 'text-red-400 bg-red-500/15 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]',
                  purple: 'text-purple-400 bg-purple-500/15 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]',
                  cyan: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]',
                  yellow: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.1)]'
               };

               return (
                  <motion.div 
                     whileHover={{ scale: 1.02 }}
                     key={i} 
                     className="p-4 rounded-xl bg-[#222631]/60 border border-white/5 hover:border-white/10 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md backdrop-blur-sm"
                  >
                     <div className="flex items-start gap-3.5 mb-2.5">
                        <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${iconColors[insight.colorTheme]}`}>
                           {insight.iconType === 'module' && <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />}
                           {insight.iconType === 'bottleneck' && <div className="w-3.5 h-3.5 border-2 border-current rotate-45" />}
                           {insight.iconType === 'risk' && <div className="text-[11px] font-bold">!</div>}
                           {insight.iconType === 'suggestion' && <div className="w-2.5 h-2.5 rounded-full bg-current" />}
                           {insight.iconType === 'connection' && <div className="w-3.5 h-3.5 border-2 border-current rounded-sm" />}
                        </div>
                        <h4 className="text-xs font-semibold text-white leading-snug">
                           {insight.title}
                        </h4>
                     </div>
                     <p className="text-[11px] text-gray-400 leading-relaxed">
                        {insight.description}
                     </p>
                  </motion.div>
               );
            })}
         </div>
      </motion.div>

    </div>
  );
}

// Helper Star Icon
function StarIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`w-3.5 h-3.5 ${className}`} viewBox="0 0 24 24" fill="#EAB308" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
    </svg>
  );
}

