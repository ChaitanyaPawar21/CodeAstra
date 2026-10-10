import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FolderTree, GitBranch, Sparkles } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { useAnalysis } from '../hooks/useAnalysis';
import { useAuth } from '../../auth/context/AuthContext';

const FEATURES = [
  { icon: FolderTree, label: 'Maps your directory structure' },
  { icon: GitBranch, label: 'Traces dependencies & flow' },
  { icon: Sparkles, label: 'Explains it in plain English' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { repoUrl, setRepoUrl } = useAnalysis();
  const { isAuthenticated, user, logout } = useAuth();
  const [inputUrl, setInputUrl] = useState(repoUrl || '');
  const [inputError, setInputError] = useState<string | null>(null);

  const handleAnalyze = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetUrl = inputUrl.trim();
    if (!targetUrl) {
      setInputError('Please enter a valid GitHub repository URL.');
      return;
    }
    setInputError(null);
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
        <div className="flex items-center gap-3">
         {isAuthenticated ? (
  <>
    <span className="hidden sm:inline text-sm text-black/60 max-w-[10rem] truncate" title={user?.email}>
      {user?.name}
    </span>
    <button
      onClick={logout}
      className="px-4 py-2 rounded-lg text-sm font-semibold hover:underline underline-offset-2"
    >
      Log out
    </button>
  </>
) : (
  <button
    onClick={() => navigate('/login')}
    className="px-4 py-2 rounded-lg text-sm font-semibold hover:underline underline-offset-2"
  >
    Log in
  </button>
)}
          {!isAuthenticated && (
            <button
              onClick={() => navigate('/register')}
              className="px-4 py-2 rounded-lg bg-indigo-500 border-2 border-black shadow-md hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform text-sm font-semibold flex items-center gap-2"
            >
              Sign up
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
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
          className="w-full flex flex-col sm:flex-row items-stretch gap-3 mb-2"
        >
          <div className="flex-1 flex items-center bg-[#FFFBE0] rounded-lg border-2 border-black shadow-md px-4">
            <FaGithub className="w-5 h-5 shrink-0" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                if (inputError) setInputError(null);
              }}
              placeholder="https://github.com/owner/repository"
              className="flex-1 bg-transparent border-none text-black px-3 py-3.5 focus:outline-none text-sm placeholder-black/40 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3.5 bg-indigo-500 border-2 border-black shadow-md hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-transform rounded-lg text-sm font-bold flex items-center justify-center gap-2 shrink-0"
          >
            Analyze
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {inputError && (
          <p className="text-xs text-rose-600 font-mono mb-4 text-left w-full pl-1">
            {inputError}
          </p>
        )}

        {/* Three plain features — no mockups, no clutter */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-2 text-sm text-black/70 mt-6">
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
