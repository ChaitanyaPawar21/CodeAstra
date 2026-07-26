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
    <div className="w-[80px] bg-[#181B26] border-r border-white/5 flex flex-col items-center py-6 h-full shrink-0 relative z-50">
      
      {/* Logo Placeholder */}
      <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-xl flex items-center justify-center font-bold text-lg mb-8 shadow-[0_0_20px_rgba(59,130,246,0.3)] shadow-blue-500/20 ring-1 ring-white/10">
        CA
      </div>

      <nav className="flex-1 w-full flex flex-col items-center gap-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `relative w-12 h-12 rounded-xl flex items-center justify-center group transition-colors duration-300 ${
                isActive ? 'text-white bg-[#2A3143]/50' : 'text-gray-500 hover:text-gray-300 hover:bg-[#222631]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-white/10 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                {/* Active Indicator Line */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -left-[16px] top-1/4 bottom-1/4 w-[3px] bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={`w-[22px] h-[22px] relative z-10 transition-colors duration-300 ${isActive ? 'text-blue-400' : ''}`} />
                
                {/* Tooltip */}
                <div className="absolute left-full ml-6 px-3 py-1.5 bg-[#2A3143] text-white text-[11px] font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-white/10 -translate-x-2 group-hover:translate-x-0">
                  {item.name}
                </div>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-white/5 w-full flex justify-center">
        <button className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-[#222631] transition-colors group relative">
          <Settings className="w-[22px] h-[22px]" />
          <div className="absolute left-full ml-6 px-3 py-1.5 bg-[#2A3143] text-white text-[11px] font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-white/10 -translate-x-2 group-hover:translate-x-0">
            Settings
          </div>
        </button>
      </div>
    </div>
  );
}
