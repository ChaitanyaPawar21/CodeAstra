import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAnalysis } from '../context/AnalysisContext';

const STEPS = ['Cloning', 'Parsing', 'Dependency Graph', 'Entry Points', 'AI Insights'];
const STEP_DURATION = 600; // ms per step

export default function LoadingPage() {
  const navigate = useNavigate();
  const { repoUrl, analyzeRepo } = useAnalysis();
  const [stepIndex, setStepIndex] = useState(0);
  const fetchedRef = useRef(false);
  const navigatedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    // Kick off analysis (sets quickFallback immediately, backend call races in background)
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      analyzeRepo(repoUrl);
    }

    // Step through progress bar
    const stepsInterval = setInterval(() => {
      setStepIndex((prev) => {
        const next = prev < STEPS.length - 1 ? prev + 1 : prev;
        return next;
      });
    }, STEP_DURATION);

    // Navigate after all steps complete + short pause
    const navDelay = STEP_DURATION * STEPS.length + 600;
    const navTimer = setTimeout(() => {
      if (isMounted && !navigatedRef.current) {
        navigatedRef.current = true;
        navigate('/dashboard');
      }
    }, navDelay);

    return () => {
      isMounted = false;
      clearInterval(stepsInterval);
      clearTimeout(navTimer);
    };
  }, []); // run once on mount

  const cleanRepoName = repoUrl.replace('https://github.com/', '').replace(/\/$/, '') || 'target repo';

  return (
    <div className="min-h-screen bg-[#090A0F] flex flex-col items-center justify-center text-white font-sans">
      <div className="w-full max-w-3xl p-8">
        <div className="text-center mb-12">
          <motion.div 
            animate={{ scale: [1, 1.03, 1], opacity: [0.9, 1, 0.9] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="inline-block px-8 py-4 bg-[#12141C] border border-indigo-500/30 rounded-2xl mb-8 shadow-xl"
          >
            <h2 className="text-2xl font-bold mb-1 text-white">Analyzing Repository...</h2>
            <p className="text-xs text-indigo-400 font-mono">{cleanRepoName}</p>
          </motion.div>
          
          <div className="flex justify-between relative mt-16 max-w-xl mx-auto">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -translate-y-1/2 -z-10" />
            <div 
              className="absolute top-1/2 left-0 h-0.5 bg-indigo-500 -translate-y-1/2 -z-10 shadow-[0_0_10px_#6366F1] transition-all duration-500" 
              style={{ width: `${(stepIndex / (STEPS.length - 1)) * 100}%` }}
            />
            
            {STEPS.map((step, i) => (
              <div key={step} className="flex flex-col items-center gap-2">
                <div className={`w-4 h-4 rounded-full transition-all ${i <= stepIndex ? 'bg-indigo-500 shadow-[0_0_15px_#6366F1]' : 'bg-slate-800 border border-white/20'}`} />
                <span className={`text-[11px] font-mono ${i <= stepIndex ? 'text-white font-medium' : 'text-slate-500'}`}>{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Terminal logs */}
        <div className="bg-[#12141C] rounded-xl overflow-hidden border border-white/10 shadow-2xl max-w-xl mx-auto">
          <div className="bg-[#090A0F] px-4 py-2.5 flex items-center gap-2 border-b border-white/5">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <span className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="text-xs text-slate-400 ml-2 font-mono">Terminal Engine</span>
          </div>
          <div className="p-4 font-mono text-xs text-slate-400 h-44 overflow-y-auto space-y-1.5 bg-[#0D0F17]">
            <p><span className="text-indigo-400">[INFO]</span> Connecting to repository {cleanRepoName}...</p>
            {stepIndex >= 1 && <p><span className="text-emerald-400">[SUCCESS]</span> Fetched tree hierarchy</p>}
            {stepIndex >= 2 && <p><span className="text-indigo-400">[INFO]</span> Extracting package configuration and language stack...</p>}
            {stepIndex >= 3 && <p><span className="text-indigo-400">[INFO]</span> Mapping component relationships & entry points...</p>}
            {stepIndex >= 3 && <p className="text-emerald-400">[SUCCESS] Generated runtime dependency graph</p>}
            {stepIndex >= 4 && <p className="text-emerald-400">[SUCCESS] AI insights ready — loading dashboard</p>}
            {stepIndex < 4 && <p className="text-indigo-300 animate-pulse">_ Processing...</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

