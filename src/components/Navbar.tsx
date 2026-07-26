import { Bell } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';

export default function Navbar() {
  return (
    <div className="h-16 bg-[#181B26] border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-10">
      
      {/* Left: Logo */}
      <div className="flex items-center gap-3 w-64 shrink-0">
        <div className="flex items-center justify-center text-blue-500 bg-blue-500/10 p-1.5 rounded-lg border border-blue-500/20">
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
           </svg>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-bold text-sm tracking-wide text-white">Codebase</span>
          <span className="text-[10px] text-gray-400">Intelligence Agent</span>
        </div>
      </div>

      {/* Middle: URL Bar */}
      <div className="flex-1 flex justify-center max-w-2xl">
         <div className="w-full relative flex items-center bg-[#222631] rounded-lg border border-white/10 p-1">
            <div className="pl-3 text-gray-400">
               <FaGithub className="w-4 h-4" />
            </div>
            <input 
               type="text" 
               defaultValue="https://github.com/facebook/react" 
               className="flex-1 bg-transparent border-none text-gray-300 px-3 py-1.5 focus:outline-none focus:ring-0 text-sm"
            />
            <button className="px-4 py-1.5 bg-[#313B6B] hover:bg-[#3d4880] text-white text-xs rounded-md font-medium border border-[#4B5A9A] transition-colors">
               Re-analyze
            </button>
         </div>
      </div>

      {/* Right: Profile */}
      <div className="flex items-center gap-4 w-64 justify-end shrink-0">
        <button className="text-gray-400 hover:text-white transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 block h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-[#181B26]" />
        </button>
        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 p-[2px]">
          <div className="h-full w-full rounded-full bg-[#181B26] border border-white/10 overflow-hidden">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
          </div>
        </div>
      </div>
      
    </div>
  );
}
