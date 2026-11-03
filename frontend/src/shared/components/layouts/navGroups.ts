import { LayoutDashboard, FolderTree, Code2, Lightbulb, MessageSquare, Network, Share2 } from 'lucide-react';

// Single source of truth for nav — Sidebar renders it, Navbar reads the same
// shape for its breadcrumb. Kept out of Sidebar.tsx so that file exports only a
// component and React Fast Refresh keeps working.
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
