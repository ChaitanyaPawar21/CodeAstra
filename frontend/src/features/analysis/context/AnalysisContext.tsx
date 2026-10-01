import React, { createContext, useContext, useState, useCallback } from 'react';
import type { DashboardData, GraphNode, GraphEdge, TechStack } from '../../../shared/types/dashboard';
import { mockRepoData } from '../../../shared/data/mockDashboardData';

// Same-origin by default: on Vercel the `/api/*` rewrite routes to the backend
// service. Set VITE_API_URL (e.g. http://localhost:5000) for bare `vite dev`.
const API_URL = import.meta.env.VITE_API_URL || '';

interface AnalysisContextType {
  repoUrl: string;
  setRepoUrl: (url: string) => void;
  analysisData: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  analyzeRepo: (url: string) => Promise<void>;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

function parseGitHubUrl(url: string) {
  const clean = url.trim().replace(/\/$/, '');
  const parts = clean.split('/');
  const name = parts[parts.length - 1] || 'Repository';
  const owner = parts.length >= 2 ? parts[parts.length - 2] : 'GitHub';
  return { owner, name, fullName: `${owner}/${name}` };
}

// language id -> display label + tailwind chip classes
const LANG_META: Record<string, TechStack> = {
  ts: { name: 'TypeScript', color: 'text-black bg-indigo-500/10 border-indigo-500/20' },
  tsx: { name: 'TypeScript (React)', color: 'text-black bg-blue-500/10 border-blue-500/20' },
  js: { name: 'JavaScript', color: 'text-black bg-amber-500/10 border-amber-500/20' },
  jsx: { name: 'JavaScript (React)', color: 'text-black bg-amber-500/10 border-amber-500/20' },
  mjs: { name: 'JavaScript', color: 'text-black bg-amber-500/10 border-amber-500/20' },
  cjs: { name: 'JavaScript', color: 'text-black bg-amber-500/10 border-amber-500/20' },
  py: { name: 'Python', color: 'text-black bg-emerald-500/10 border-emerald-500/20' },
  java: { name: 'Java', color: 'text-black bg-rose-500/10 border-rose-500/20' },
};

const runCmdFor = (lang: string) =>
  lang === 'py' ? 'python main.py' : lang === 'java' ? './mvnw spring-boot:run' : 'npm run dev';
const installCmdFor = (lang: string) =>
  lang === 'py' ? 'pip install -r requirements.txt' : lang === 'java' ? './mvnw install' : 'npm install';

// Map the backend v2 result (m1/m2/m3) into DashboardData — all derived, never fabricated.
function transformReal(raw: any, targetUrl: string): DashboardData {
  const { name, fullName } = parseGitHubUrl(targetUrl);
  const m1 = Array.isArray(raw?.m1) ? raw.m1 : [];
  const m2 = raw?.m2 ?? null;
  const m3 = raw?.m3 ?? {};
  const files: Record<string, any> = m3.files ?? {};
  const ids = Object.keys(files);
  const stats = m3.stats ?? { files: ids.length, parsed: ids.length, edges: (m3.edges ?? []).length, unresolved: 0, truncated: false, truncatedReason: null, unsupportedLanguages: [] };

  // --- dependency graph (real) ---
  const cycleOf = new Map<string, number>();
  (m3.cycles ?? []).forEach((c: string[], i: number) => c.forEach((id) => cycleOf.set(id, i)));

  const nodes: GraphNode[] = ids.map((id) => {
    const f = files[id];
    return {
      id,
      label: f.path,
      type: f.layer,
      language: f.language,
      layerReason: f.layerReason,
      loc: f.loc,
      exports: f.exports ?? [],
      externalPackages: f.externalPackages ?? [],
      imports: f.imports ?? [],
      importedBy: f.importedBy ?? [],
    };
  });

  const edges: GraphEdge[] = (m3.edges ?? []).map((e: any) => ({
    source: e.source,
    target: e.target,
    typeOnly: e.typeOnly,
    cyclic: cycleOf.has(e.source) && cycleOf.get(e.source) === cycleOf.get(e.target),
  }));

  // --- language mix ---
  const langCount = new Map<string, number>();
  for (const id of ids) {
    const l = files[id].language;
    if (l && l !== 'other') langCount.set(l, (langCount.get(l) ?? 0) + 1);
  }
  const langsByFreq = [...langCount.entries()].sort((a, b) => b[1] - a[1]).map(([l]) => l);
  const primaryLang = langsByFreq[0] ?? 'ts';
  const techStack: TechStack[] = langsByFreq.slice(0, 4).map((l) => LANG_META[l] ?? { name: l, color: 'text-slate-300 bg-slate-500/10 border-slate-500/20' });

  // --- folders (prefer m1, else derive top-level dirs with real counts) ---
  const dirCount = new Map<string, number>();
  for (const id of ids) {
    const p = files[id].path as string;
    const top = p.includes('/') ? p.slice(0, p.indexOf('/')) : '.';
    dirCount.set(top, (dirCount.get(top) ?? 0) + 1);
  }
  const folderHierarchy = m1.length
    ? m1.map((item: any) => ({
        name: item.path,
        explanation: item.purpose,
        filesCount: ids.filter((id) => (files[id].path as string).startsWith(item.path)).length,
        isStarred: item.type === 'entry',
      }))
    : [...dirCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([dir, count]) => ({
        name: dir,
        explanation: `${count} file${count === 1 ? '' : 's'}`,
        filesCount: count,
      }));

  // --- entry points (prefer m2, else entry-layer files) ---
  const entryNodes = nodes.filter((n) => n.type === 'entry');
  const entryPoints = m2?.file
    ? [{ label: m2.file }, ...((m2.executionFlow ?? []).map((s: string) => ({ label: s })))]
    : entryNodes.slice(0, 5).map((n) => ({ label: n.label }));

  // --- critical files: most-imported (real fan-in) ---
  const colorByRank = ['red', 'yellow', 'purple', 'blue'] as const;
  const criticalFiles = [...nodes]
    .sort((a, b) => (b.importedBy?.length ?? 0) - (a.importedBy?.length ?? 0))
    .filter((n) => (n.importedBy?.length ?? 0) > 0)
    .slice(0, 4)
    .map((n, i) => ({
      name: n.label,
      importance: `Imported by ${n.importedBy!.length} module${n.importedBy!.length === 1 ? '' : 's'} (${n.type})`,
      riskLevel: n.importedBy!.length >= 5 ? 'High' : 'Medium',
      colorTheme: colorByRank[i] ?? 'blue',
      isStarred: i < 2,
    }));

  // --- AI insights derived from graph structure (no templated per-file text) ---
  const mostImported = criticalFiles[0];
  const aiInsights = [
    mostImported && {
      title: 'Most connected module',
      description: `${mostImported.name} is imported by the most modules — changes here have the widest blast radius.`,
      iconType: 'connection' as const,
      colorTheme: 'blue' as const,
    },
    {
      title: (m3.cycles?.length ?? 0) > 0 ? `${m3.cycles.length} circular dependency group(s)` : 'No circular dependencies',
      description: (m3.cycles?.length ?? 0) > 0
        ? 'Import cycles detected — shown as dashed red edges in the graph.'
        : 'No import cycles were found in the resolved graph.',
      iconType: 'risk' as const,
      colorTheme: (m3.cycles?.length ?? 0) > 0 ? ('red' as const) : ('cyan' as const),
    },
    {
      title: 'Graph coverage',
      description: `${stats.parsed}/${stats.files} files parsed, ${stats.edges} edges, ${stats.unresolved} unresolved import(s)${stats.unsupportedLanguages.length ? `; unsupported: ${stats.unsupportedLanguages.join(', ')}` : ''}.`,
      iconType: 'module' as const,
      colorTheme: 'purple' as const,
    },
  ].filter(Boolean) as DashboardData['aiInsights'];

  const avgFanout = stats.files ? Math.round((stats.edges / stats.files) * 10) / 10 : 0;

  return {
    repoUrl: targetUrl,
    isSample: false,
    summary: {
      title: name.charAt(0).toUpperCase() + name.slice(1),
      techStack,
      totalFiles: stats.files,
      complexity: avgFanout,
      description: m2?.description || `Deterministic dependency analysis of ${fullName}: ${stats.files} files, ${stats.edges} import edges, ${m3.cycles?.length ?? 0} cycle group(s).`,
      bulletPoints: [
        `Target: ${fullName}`,
        `Primary language: ${LANG_META[primaryLang]?.name ?? primaryLang}`,
        `${stats.edges} resolved import edges across ${stats.files} files`,
      ],
    },
    repositoryOverview: {
      name: fullName,
      category: `${LANG_META[primaryLang]?.name ?? primaryLang} project`,
      description: m2?.description || `Static dependency graph for ${fullName}, built from parsed imports.`,
      technologies: techStack.map((t) => t.name),
      architectures: [...new Set(nodes.map((n) => n.type))].slice(0, 6),
      capabilities: m1.slice(0, 4).map((f: any) => f.purpose).filter(Boolean),
    },
    quickSetupGuide: {
      techStack: techStack.map((t) => t.name),
      installCommand: installCmdFor(primaryLang),
      runCommand: runCmdFor(primaryLang),
    },
    folderHierarchy,
    entryPoints,
    criticalFiles,
    requestLifecycle: mockRepoData.requestLifecycle, // generic 6-step illustration; not analysis output
    aiInsights,
    dependencyGraph: {
      nodes,
      edges,
      cycles: m3.cycles ?? [],
      orphans: m3.orphans ?? [],
      layerFlow: m3.layerFlow ?? [],
      stats,
    },
  };
}

export const AnalysisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [repoUrl, setRepoUrl] = useState<string>('https://github.com/facebook/react');
  const [analysisData, setAnalysisData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeRepo = useCallback(async (url: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setRepoUrl(url);

    try {
      const response = await fetch(`${API_URL}/api/analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: url }),
      });
      const json = await response.json().catch(() => null);

      if (!response.ok || !json?.success || !json?.data) {
        const msg = json?.message || json?.errors?.join(' | ') || `Request failed (${response.status})`;
        setError(msg);
        return;
      }
      setAnalysisData(transformReal(json.data, url));
    } catch (err: any) {
      setError(err?.message || 'Could not reach the analysis backend.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AnalysisContext.Provider value={{ repoUrl, setRepoUrl, analysisData, isLoading, error, analyzeRepo }}>
      {children}
    </AnalysisContext.Provider>
  );
};

export const useAnalysis = () => {
  const context = useContext(AnalysisContext);
  if (!context) throw new Error('useAnalysis must be used within an AnalysisProvider');
  return context;
};
