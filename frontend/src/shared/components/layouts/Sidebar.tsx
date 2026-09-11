import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderTree, Code2, Lightbulb, MessageSquare, Network, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Sidebar() {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Repository Structure', path: '/repository', icon: FolderTree },
    { name: 'Code Analysis', path: '/code', icon: Code2 },
    { name: 'AI Insights', path: '/insights', icon: Lightbulb },
    { name: 'Dependency Graph', path: '/graph', icon: Network },
    { name: 'AI Chat', path: '/chat', icon: MessageSquare },
  ];

  return (
    <div className="w-[72px] bg-[#0D0E14] border-r border-white/[0.06] flex flex-col items-center py-5 h-full shrink-0 relative z-50">
      
      {/* Brand Icon */}
      <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-sm mb-6 shadow-md shadow-indigo-600/20 border border-indigo-400/30">
        CA
      </div>

      <nav className="flex-1 w-full flex flex-col items-center gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `relative w-10 h-10 rounded-xl flex items-center justify-center group transition-colors duration-200 ${
                isActive ? 'text-white bg-indigo-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-indigo-500/10 rounded-xl border border-indigo-500/20"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                {/* Active Left Indicator Bar */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -left-[16px] top-2 bottom-2 w-[3px] bg-indigo-500 rounded-r-full shadow-sm"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={`w-5 h-5 relative z-10 transition-colors duration-200 ${isActive ? 'text-indigo-400' : ''}`} />
                
                {/* Tooltip */}
                <div className="absolute left-full ml-4 px-2.5 py-1 bg-[#1A1C28] text-slate-200 text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 whitespace-nowrap z-50 shadow-lg border border-white/10 -translate-x-1 group-hover:translate-x-0">
                  {item.name}
                </div>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-3 border-t border-white/[0.06] w-full flex justify-center">
        <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors group relative">
          <Settings className="w-5 h-5" />
          <div className="absolute left-full ml-4 px-2.5 py-1 bg-[#1A1C28] text-slate-200 text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 whitespace-nowrap z-50 shadow-lg border border-white/10 -translate-x-1 group-hover:translate-x-0">
            Settings
          </div>
        </button>
      </div>
    </div>
  );
}

