
import { motion } from 'framer-motion';
import { AlertTriangle, Lightbulb, Activity, ArrowRight } from 'lucide-react';
import { mockRepoData } from '../data/mockDashboardData';

export default function AIInsightsPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden text-gray-300">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 px-2"
      >
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Lightbulb className="w-8 h-8 text-yellow-400" />
          AI Intelligence Center
        </h1>
        <p className="text-gray-400 mt-2">Deep architectural analysis and recommended optimizations</p>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex-1 overflow-y-auto pr-2 scrollbar-hide pb-10 space-y-6 px-2"
      >
        <div className="grid grid-cols-2 gap-6">
          {mockRepoData.aiInsights.map((insight, i) => {
             const iconColors: Record<string, string> = {
                blue: 'text-blue-400 bg-blue-500/15 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]',
                red: 'text-red-400 bg-red-500/15 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]',
                purple: 'text-purple-400 bg-purple-500/15 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]',
                cyan: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]',
                yellow: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
             };
             
             return (
               <motion.div variants={itemVariants} key={i} className="bg-[#1E2330]/80 backdrop-blur-xl border border-white/5 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer hover:bg-[#1E2330]">
                 <div className="flex items-start gap-5">
                   <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${iconColors[insight.colorTheme]}`}>
                       {insight.iconType === 'module' && <Activity className="w-5 h-5" />}
                       {insight.iconType === 'bottleneck' && <AlertTriangle className="w-5 h-5" />}
                       {insight.iconType === 'risk' && <div className="text-xl font-bold">!</div>}
                       {insight.iconType === 'suggestion' && <Lightbulb className="w-5 h-5" />}
                       {insight.iconType === 'connection' && <ArrowRight className="w-5 h-5" />}
                   </div>
                   <div>
                     <h3 className="text-lg font-semibold text-white mb-2">{insight.title}</h3>
                     <p className="text-sm text-gray-400 leading-relaxed">{insight.description}</p>
                     
                     <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                       <span className="text-xs text-blue-400 font-medium">View detailed analysis</span>
                       <ArrowRight className="w-4 h-4 text-blue-400" />
                     </div>
                   </div>
                 </div>
               </motion.div>
             )
          })}
        </div>
      </motion.div>
    </div>
  );
}
