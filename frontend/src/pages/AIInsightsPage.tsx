
import { motion } from 'framer-motion';
import { AlertTriangle, Lightbulb, Activity, ArrowRight, Sparkles } from 'lucide-react';
import { mockRepoData } from '../data/mockDashboardData';
import { useAnalysis } from '../context/AnalysisContext';

export default function AIInsightsPage() {
  const { analysisData } = useAnalysis();
  const data = analysisData || mockRepoData;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden text-slate-300">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Intelligence Center</h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Automated architectural discovery & optimization roadmap ({data.summary.title})</p>
          </div>
        </div>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex-1 overflow-y-auto pr-1 scrollbar-hide pb-10 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {data.aiInsights.map((insight, i) => {
             const iconColors: Record<string, string> = {
                blue: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
                red: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
                purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
                cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
                yellow: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
             };
             
             return (
               <motion.div 
                 variants={itemVariants} 
                 key={i} 
                 className="bg-[#12141C] border border-white/[0.07] rounded-2xl p-6 shadow-lg hover:border-white/[0.15] transition-all duration-300 group cursor-pointer"
               >
                 <div className="flex items-start gap-4">
                   <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${iconColors[insight.colorTheme] || iconColors.blue}`}>
                       {insight.iconType === 'module' && <Activity className="w-4 h-4" />}
                       {insight.iconType === 'bottleneck' && <AlertTriangle className="w-4 h-4" />}
                       {insight.iconType === 'risk' && <div className="text-sm font-bold font-mono">!</div>}
                       {insight.iconType === 'suggestion' && <Lightbulb className="w-4 h-4" />}
                       {insight.iconType === 'connection' && <ArrowRight className="w-4 h-4" />}
                   </div>
                   <div className="flex-1">
                     <h3 className="text-base font-semibold text-white mb-1.5 group-hover:text-indigo-300 transition-colors">{insight.title}</h3>
                     <p className="text-xs text-slate-400 leading-relaxed">{insight.description}</p>
                     
                     <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between opacity-80 group-hover:opacity-100 transition-opacity">
                       <span className="text-xs font-mono text-indigo-400 font-medium">Explore recommendation</span>
                       <ArrowRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
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

