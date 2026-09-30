import { Bell } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';

export default function Navbar() {
  return (
    <div className="h-16 bg-[#0D0E14]/90 backdrop-blur-md border-b border-white/[0.06] flex items-center justify-between px-6 sticky top-0 z-50">
      
      {/* Left: Logo */}
      <div className="flex items-center gap-3 w-64 shrink-0">
        <div className="flex items-center justify-center text-indigo-400 bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/20 shadow-sm">
           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
           </svg>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-semibold text-sm tracking-tight text-slate-100">CodeAstra</span>
          <span className="text-[10px] text-slate-400 font-mono">Repository Intelligence</span>
        </div>
      </div>

      {/* Middle: URL Bar */}
      <div className="flex-1 flex justify-center max-w-xl">
         <div className="w-full relative flex items-center bg-[#161824] rounded-lg border border-white/[0.08] p-1 transition-all focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/20">
            <div className="pl-3 text-slate-400">
               <FaGithub className="w-4 h-4" />
            </div>
            <input 
               type="text" 
               defaultValue="https://github.com/facebook/react" 
               className="flex-1 bg-transparent border-none text-slate-200 px-3 py-1 text-xs focus:outline-none focus:ring-0 font-mono placeholder-slate-500"
            />
            <button className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-md font-medium transition-all shadow-sm">
               Re-analyze
            </button>
         </div>
      </div>

      {/* Right: Profile */}
      <div className="flex items-center gap-4 w-64 justify-end shrink-0">
        <button className="p-2 text-slate-400 hover:text-white transition-colors relative rounded-lg hover:bg-white/[0.04]">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 block h-1.5 w-1.5 rounded-full bg-indigo-500 ring-2 ring-[#0D0E14]" />
        </button>
        <div className="flex items-center gap-2 pl-2 border-l border-white/[0.06]">
          <div className="h-8 w-8 rounded-full bg-slate-800 border border-white/[0.1] overflow-hidden">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
          </div>
          <span className="text-xs font-medium text-slate-300 hidden sm:inline-block">Developer</span>
        </div>
      </div>
      
    </div>
  );
}

