import { FolderTree, Code2, GitBranch, Layers, Sparkles, MessageSquare, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAnalysis } from '../hooks/useAnalysis';

const EXPLORE = [
  { to: '/repository', icon: FolderTree, title: 'Repository Structure', desc: 'Browse the file tree and how it is organized' },
  { to: '/code', icon: Code2, title: 'Code Analysis', desc: 'Read the critical files and what they do' },
  { to: '/graph', icon: GitBranch, title: 'Dependency Graph', desc: 'See how modules connect' },
  { to: '/architecture', icon: Layers, title: 'Architecture', desc: 'Understand the high-level design' },
  { to: '/insights', icon: Sparkles, title: 'AI Insights', desc: 'Key observations about the codebase' },
  { to: '/chat', icon: MessageSquare, title: 'Ask AI', desc: 'Chat with the repo in plain English' },
];

const riskStyle = (level: string) =>
  level === 'High' ? 'bg-rose-500/20 text-black border-black'
  : level === 'Medium' ? 'bg-amber-500/30 text-black border-black'
  : 'bg-emerald-500/20 text-black border-black';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { analysisData } = useAnalysis();
  const data = analysisData!;
  const { summary, criticalFiles } = data;

  const stats = [
    { label: 'Total files', value: summary.totalFiles },
    { label: 'Complexity', value: summary.complexity },
    { label: 'Dependencies', value: data.dependencyGraph.edges?.length ?? 0 },
    { label: 'Primary language', value: summary.techStack[0]?.name || 'N/A' },
  ];

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col gap-6 text-black pb-6">

      {/* Summary */}
      <section className="bg-[#FFFBE0] rounded-xl border-2 border-black shadow-md p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{summary.title}</h1>
            <p className="text-sm text-black/60">Repository summary</p>
          </div>
          <span className="shrink-0 px-3 py-1 rounded-full bg-emerald-500/20 border-2 border-black text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Analyzed
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg bg-[#FBF3C4] border-2 border-black p-3">
              <div className="text-[11px] font-mono uppercase text-black/50 mb-0.5">{s.label}</div>
              <div className="text-lg font-bold tracking-tight">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {summary.techStack.map((tech) => (
            <span key={tech.name} className="px-2.5 py-1 rounded-md text-xs font-mono bg-[#FBF3C4] border-2 border-black">
              {tech.name}
            </span>
          ))}
        </div>

        <p className="text-sm text-black/70 leading-relaxed">{summary.description}</p>
      </section>

      {/* Explore — launchpad to the detail pages */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-black/60 mb-3">Explore</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EXPLORE.map(({ to, icon: Icon, title, desc }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="text-left bg-[#FFFBE0] rounded-xl border-2 border-black shadow-md p-5 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-transform group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500 border-2 border-black flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="font-bold text-sm mb-1">{title}</h3>
              <p className="text-xs text-black/60 leading-relaxed">{desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Critical files */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-black/60 mb-3">Critical files</h2>
        <div className="flex flex-col gap-3">
          {criticalFiles.map((file, i) => (
            <div key={i} className="bg-[#FFFBE0] rounded-xl border-2 border-black shadow-md p-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-mono font-semibold text-sm break-all mb-1">{file.name}</div>
                <p className="text-xs text-black/60 leading-relaxed">{file.importance}</p>
              </div>
              <span className={`shrink-0 px-2 py-0.5 rounded text-[11px] font-mono border-2 ${riskStyle(file.riskLevel)}`}>
                {file.riskLevel}
              </span>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
