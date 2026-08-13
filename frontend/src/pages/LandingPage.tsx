import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Code2, FolderTree, GitBranch, Sparkles, Terminal } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { useAnalysis } from '../context/AnalysisContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { repoUrl, setRepoUrl } = useAnalysis();
  const [inputUrl, setInputUrl] = useState(repoUrl || '');

  const handleAnalyze = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetUrl = inputUrl.trim() || 'https://github.com/facebook/react';
    setRepoUrl(targetUrl);
    navigate('/loading');
  };

  return (
    <div className="min-h-screen bg-[#090A0F] text-slate-100 font-sans overflow-x-hidden relative selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Background Subtle Grid & Light Gradient Ambient */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
         <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25"></div>
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-indigo-600/10 via-purple-600/5 to-transparent blur-[120px] rounded-full"></div>
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 max-w-[1300px] mx-auto relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-600/20 border border-indigo-400/30">
             CA
          </div>
          <div className="flex flex-col leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-base tracking-tight text-white">CodeAstra</span>
              <span className="text-[10px] font-mono font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded">AI</span>
            </div>
            <span className="text-xs text-slate-400">Codebase Intelligence Agent</span>
          </div>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
          <a href="#docs" className="hover:text-white transition-colors">Docs</a>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-2"
          >
            Launch App
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-[1100px] mx-auto px-6 pt-16 pb-20 text-center relative z-10">
        
        {/* Subtle Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-white/[0.08] text-xs text-slate-300 mb-8 backdrop-blur-md"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-mono text-slate-400">Autonomous Repository Analysis</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.15] mb-6 text-white max-w-4xl mx-auto"
        >
          Understand Any <span className="gradient-text">Codebase</span> in Minutes
        </motion.h1>
        
        {/* Hero Description */}
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          AI-powered repository intelligence that maps architecture, execution flow, dependencies, and critical logic for instant developer onboarding.
        </motion.p>

        {/* Repository URL Input */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="max-w-[640px] mx-auto relative group mb-20"
        >
          <form onSubmit={handleAnalyze} className="relative flex items-center bg-[#13151F] rounded-xl p-1.5 border border-white/[0.1] shadow-2xl transition-all focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/20">
            <div className="pl-4 text-slate-400">
               <FaGithub className="w-5 h-5" />
            </div>
            <input 
              type="text" 
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Paste GitHub Repository URL (e.g. facebook/react)..." 
              className="flex-1 bg-transparent border-none text-white px-4 py-3 focus:outline-none focus:ring-0 text-sm placeholder-slate-500 font-mono"
            />
            <button 
              type="submit"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-2 shadow-sm"
            >
              Analyze
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="flex items-center justify-center gap-6 mt-3 text-xs text-slate-500 font-mono">
            <span>✓ Works with React, Node, Python, Go, Rust</span>
            <span>✓ No installation needed</span>
          </div>
        </motion.div>

        {/* Feature Cards Showcase */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1100px] mx-auto text-left">
          
          {/* Card 1: Directory Structure */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#12141C] rounded-2xl p-6 border border-white/[0.07] hover:border-white/[0.14] transition-all flex flex-col group shadow-lg"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5">
              <FolderTree className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Directory Mapping</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Automatically indexes file hierarchies, categorizing controllers, services, and models.
            </p>
            <div className="mt-auto bg-[#090A0F] rounded-xl border border-white/[0.06] p-3.5 font-mono text-xs text-slate-400 space-y-1.5">
               <div className="flex items-center gap-2 text-indigo-300"><FolderTree className="w-3.5 h-3.5" /> src/</div>
               <div className="pl-4 flex items-center gap-2 text-slate-400"><Code2 className="w-3 h-3 text-slate-500" /> controllers/</div>
               <div className="pl-4 flex items-center gap-2 text-slate-400"><Code2 className="w-3 h-3 text-slate-500" /> services/</div>
               <div className="pl-4 flex items-center gap-2 text-slate-400"><Code2 className="w-3 h-3 text-slate-500" /> models/</div>
            </div>
          </motion.div>

          {/* Card 2: Execution Pipeline */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#12141C] rounded-2xl p-6 border border-white/[0.07] hover:border-white/[0.14] transition-all flex flex-col group shadow-lg"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Execution Pipeline</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Traces entry points, middleware chains, and runtime execution paths automatically.
            </p>
            <div className="mt-auto bg-[#090A0F] rounded-xl border border-white/[0.06] p-3.5 flex flex-col gap-2">
               <div className="flex items-center justify-between px-3 py-1.5 rounded bg-slate-900 border border-white/[0.06] text-xs font-mono text-slate-300">
                 <span>▶ server.js</span>
                 <span className="text-[10px] text-emerald-400">Entry</span>
               </div>
               <div className="w-0.5 h-3 bg-slate-700 mx-auto"></div>
               <div className="flex items-center justify-between px-3 py-1.5 rounded bg-slate-900 border border-white/[0.06] text-xs font-mono text-slate-400">
                 <span>routes/api.js</span>
                 <span className="text-[10px] text-slate-500">Router</span>
               </div>
            </div>
          </motion.div>

          {/* Card 3: Dependency Graph */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[#12141C] rounded-2xl p-6 border border-white/[0.07] hover:border-white/[0.14] transition-all flex flex-col group shadow-lg"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5">
              <GitBranch className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Dependency Graph</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Visualizes component links, imported modules, and database interactions interactively.
            </p>
            <div className="mt-auto bg-[#090A0F] rounded-xl border border-white/[0.06] p-3.5 flex items-center justify-between">
               <div className="px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-mono text-indigo-300">
                 UserRoute
               </div>
               <div className="h-[1px] flex-1 bg-white/10 mx-2"></div>
               <div className="px-2.5 py-1 rounded bg-slate-800 border border-white/10 text-[11px] font-mono text-slate-300">
                 UserController
               </div>
            </div>
          </motion.div>

        </div>

      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-white/[0.06] py-8 text-center text-xs text-slate-500 font-mono relative z-10">
        CodeAstra &copy; {new Date().getFullYear()} — Minimalist Codebase Intelligence
      </footer>

    </div>
  );
}

