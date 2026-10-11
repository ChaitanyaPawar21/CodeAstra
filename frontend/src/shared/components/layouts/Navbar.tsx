import { useState, useEffect } from 'react';
import { Bell, RefreshCw, ChevronRight, LogOut } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAnalysis } from '../../../features/analysis/hooks/useAnalysis';
import { useAuth } from '../../../features/auth/context/AuthContext';
import { navGroups } from './Sidebar';
import UserAvatar from './userAvatar';

// Resolve the current route to "Group ▸ Page" for the breadcrumb.
function useBreadcrumb() {
  const { pathname } = useLocation();
  for (const group of navGroups) {
    const item = group.items.find((i) => i.path === pathname);
    if (item) return { group: group.label, page: item.name };
  }
  return { group: '', page: 'Overview' };
}

export default function Navbar() {
  const navigate = useNavigate();
  const { repoUrl, setRepoUrl } = useAnalysis();
  const { user, logout } = useAuth();
  const [inputUrl, setInputUrl] = useState(repoUrl);
  const crumb = useBreadcrumb();

  // Keep input in sync if repoUrl changes externally (e.g. initial context load)
  useEffect(() => {
    setInputUrl(repoUrl);
  }, [repoUrl]);

  const handleReanalyze = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const url = inputUrl.trim() || repoUrl;
    if (!url) return;
    setRepoUrl(url);
    navigate('/loading');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="h-16 bg-[#FBF3C4]/90 backdrop-blur-md border-b border-black flex items-center justify-between px-6 sticky top-0 z-50">
      
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-2 w-64 shrink-0 text-sm">
        {crumb.group && (
          <>
            <span className="text-slate-500">{crumb.group}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          </>
        )}
        <span className="font-semibold text-slate-100">{crumb.page}</span>
      </div>

      {/* Middle: URL Bar */}
      <div className="flex-1 flex justify-center max-w-xl">
        <form
          onSubmit={handleReanalyze}
          className="w-full relative flex items-center bg-[#FFFBE0] rounded-lg border border-black p-1 transition-all focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/20"
        >
          <div className="pl-3 text-slate-400">
            <FaGithub className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Paste GitHub repo URL..."
            className="flex-1 bg-transparent border-none text-slate-200 px-3 py-1 text-xs focus:outline-none focus:ring-0 font-mono placeholder-slate-500"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-black text-xs rounded-md font-medium transition-all shadow-sm"
          >
            <RefreshCw className="w-3 h-3" />
            Re-analyze
          </button>
        </form>
      </div>

      {/* Right: Profile */}
      <div className="flex items-center gap-4 w-64 justify-end shrink-0">
        <button className="p-2 text-slate-400 hover:text-black transition-colors relative rounded-lg hover:bg-black/[0.04]">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 block h-1.5 w-1.5 rounded-full bg-indigo-500 ring-2 ring-[#FBF3C4]" />
        </button>
        <div className="flex items-center gap-2 pl-2 border-l border-black">
          <UserAvatar size={32} />
          <span className="text-xs font-medium text-slate-300 hidden sm:inline-block max-w-[8rem] truncate" title={user?.email}>
            {user?.name ?? 'Developer'}
          </span>
          <button
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
            className="p-2 text-slate-400 hover:text-black transition-colors rounded-lg hover:bg-black/[0.04]"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
      
    </div>
  );
}

