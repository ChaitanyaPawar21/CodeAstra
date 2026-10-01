import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FolderTree, GitBranch, Sparkles } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { useAnalysis } from '../context/AnalysisContext';

const FEATURES = [
  { icon: FolderTree, label: 'Maps your directory structure' },
  { icon: GitBranch, label: 'Traces dependencies & flow' },
  { icon: Sparkles, label: 'Explains it in plain English' },
];

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
    <div className="min-h-screen bg-[#FBF3C4] text-black font-sans flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between px-6 sm:px-10 py-5 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-indigo-500 border-2 border-black shadow-md flex items-center justify-center font-bold text-sm">
            CA
          </div>
          <span className="font-bold text-lg tracking-tight">CodeAstra</span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 rounded-lg bg-indigo-500 border-2 border-black shadow-md hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform text-sm font-semibold flex items-center gap-2"
        >
          Launch App
          <ArrowRight className="w-4 h-4" />
        </button>
      </header>

      {/* Hero — single focus: paste a repo */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-2xl mx-auto w-full -mt-10">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-4">
          Understand any codebase in minutes
        </h1>
        <p className="text-base sm:text-lg text-black/60 mb-10">
          Paste a GitHub repo. We map the architecture, dependencies, and logic so you don't have to.
        </p>

        <form
          onSubmit={handleAnalyze}
          className="w-full flex flex-col sm:flex-row items-stretch gap-3 mb-5"
        >
          <div className="flex-1 flex items-center bg-[#FFFBE0] rounded-lg border-2 border-black shadow-md px-4">
            <FaGithub className="w-5 h-5 shrink-0" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="github.com/facebook/react"
              className="flex-1 bg-transparent border-none text-black px-3 py-3.5 focus:outline-none text-sm placeholder-black/40 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3.5 bg-indigo-500 border-2 border-black shadow-md hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-transform rounded-lg text-sm font-bold flex items-center justify-center gap-2"
          >
            Analyze
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Three plain features — no mockups, no clutter */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-2 text-sm text-black/70">
          {FEATURES.map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-2">
              <Icon className="w-4 h-4" />
              {label}
            </span>
          ))}
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-black/50 font-mono">
        CodeAstra © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
