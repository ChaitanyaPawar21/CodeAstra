import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderTree, Code2, Lightbulb, MessageSquare, Network, Share2, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

// Single source of truth for nav — Navbar reads the same shape for its breadcrumb.
export const navGroups = [
  {
    label: 'Overview',
    items: [{ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Explore',
    items: [
      { name: 'Repository', path: '/repository', icon: FolderTree },
      { name: 'Dependency Graph', path: '/graph', icon: Network },
      { name: 'Architecture', path: '/architecture', icon: Share2 },
      { name: 'Code Analysis', path: '/code', icon: Code2 },
    ],
  },
  {
    label: 'AI',
    items: [
      { name: 'AI Insights', path: '/insights', icon: Lightbulb },
      { name: 'AI Chat', path: '/chat', icon: MessageSquare },
    ],
  },
];

export default function Sidebar() {
  return (
    <div className="w-60 bg-[#FBF3C4] border-r border-black flex flex-col py-5 h-full shrink-0 relative z-50">

      {/* Brand */}
      <div className="flex items-center gap-3 px-5 mb-7">
        <div className="w-9 h-9 bg-indigo-600 text-black rounded-xl flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-600/20 border border-indigo-400/30">
          CA
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-semibold text-sm tracking-tight text-slate-100">CodeAstra</span>
          <span className="text-[10px] text-slate-400 font-mono">Repository Intelligence</span>
        </div>
      </div>

      <nav className="flex-1 w-full flex flex-col gap-6 px-3 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <span className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {group.label}
            </span>
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-200 ${
                    isActive ? 'text-black' : 'text-slate-400 hover:text-slate-200 hover:bg-black/[0.04]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="activeNavItem"
                        className="absolute inset-0 bg-indigo-500/10 rounded-lg border border-indigo-500/20"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <item.icon className={`w-[18px] h-[18px] relative z-10 shrink-0 ${isActive ? 'text-black' : ''}`} />
                    <span className="relative z-10 font-medium">{item.name}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="mt-auto pt-3 px-3 border-t border-black">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-black/[0.04] transition-colors">
          <Settings className="w-[18px] h-[18px]" />
          <span className="font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
}
