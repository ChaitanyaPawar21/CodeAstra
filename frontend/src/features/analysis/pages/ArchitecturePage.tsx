import { useEffect, useMemo, useRef, useState } from 'react';
import type { Architecture } from '../../../shared/types/dashboard';
import { useAnalysis } from '../context/AnalysisContext';

// One colour per group, cycled (fill, stroke, text) - same scheme as GitDiagram.
const PALETTE = [
  ['#dbeafe', '#3b82f6', '#1e3a8a'],
  ['#fef3c7', '#f59e0b', '#78350f'],
  ['#fee2e2', '#ef4444', '#7f1d1d'],
  ['#dcfce7', '#22c55e', '#14532d'],
  ['#ede9fe', '#8b5cf6', '#4c1d95'],
  ['#ccfbf1', '#14b8a6', '#134e4a'],
];

// Mermaid node shape wrappers.
const SHAPES: Record<string, [string, string]> = {
  rect: ['["', '"]'],
  cylinder: ['[("', '")]'],
  circle: ['(("', '"))'],
  hexagon: ['{{"', '"}}'],
  stadium: ['(["', '"])'],
};

// Text goes inside a quoted Mermaid label: entity-encode anything that could break out of it.
const esc = (s: string) => s.replace(/[&"<>#]/g, (ch) => `#${ch.charCodeAt(0)};`);
const mid = (id: string) => `n_${id.replace(/[^A-Za-z0-9_]/g, '_')}`;
const basename = (p: string) => p.split('/').pop() || p;

const githubHref = (repoUrl: string, path: string) =>
  `${repoUrl.trim().replace(/\/+$/, '').replace(/\.git$/, '')}/tree/HEAD/${path}`;

/** Deterministic compile: validated architecture -> Mermaid flowchart source. */
function toMermaid(arch: Architecture, repoUrl: string): string {
  const out = ['flowchart TD'];
  const node = (c: Architecture['components'][number]) => {
    const [open, close] = SHAPES[c.shape] ?? SHAPES.rect;
    // The model sometimes writes a sentence as the role; keep nodes compact like GitDiagram's.
    const role = c.role?.split(/\s+/).length > 6 ? `${c.role.split(/\s+/).slice(0, 6).join(' ')}…` : c.role;
    const lines = [c.label, role, c.paths[0] && `[${basename(c.paths[0])}]`].filter(Boolean).map((l) => esc(l as string));
    return `${mid(c.id)}${open}${lines.join('<br/>')}${close}`;
  };

  arch.groups.forEach((g, i) => {
    out.push(`  subgraph ${mid('g_' + g.id)}["${esc(g.label)}"]`, '    direction TB');
    arch.components.filter((c) => c.group === g.id).forEach((c) => out.push(`    ${node(c)}`));
    out.push('  end', `  style ${mid('g_' + g.id)} fill:#f7f7f7,stroke:#e5e5e5,color:#333`);
    const [fill, stroke, color] = PALETTE[i % PALETTE.length];
    out.push(`  classDef grp${i} fill:${fill},stroke:${stroke},color:${color},stroke-width:1.5px`);
    const ids = arch.components.filter((c) => c.group === g.id).map((c) => mid(c.id));
    if (ids.length) out.push(`  class ${ids.join(',')} grp${i}`);
  });

  const loose = arch.components.filter((c) => !c.group);
  loose.forEach((c) => out.push(`  ${node(c)}`));
  out.push('  classDef ext fill:#ffffff,stroke:#111827,color:#111827,stroke-width:1.5px');
  if (loose.length) out.push(`  class ${loose.map((c) => mid(c.id)).join(',')} ext`);

  arch.edges.forEach((e) => out.push(`  ${mid(e.from)} -->|"${esc(e.label)}"| ${mid(e.to)}`));

  arch.components
    .filter((c) => c.paths[0])
    .forEach((c) => out.push(`  click ${mid(c.id)} "${githubHref(repoUrl, c.paths[0])}" _blank`));
  return out.join('\n');
}

let renderSeq = 0;

export default function ArchitecturePage() {
  const { analysisData } = useAnalysis();
  const arch = analysisData?.architecture;
  const code = useMemo(() => (arch ? toMermaid(arch, analysisData!.repoUrl) : ''), [arch, analysisData]);
  const host = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [baseWidth, setBaseWidth] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!code || !host.current) return;
    let cancelled = false;
    (async () => {
      try {
        const { default: mermaid } = await import('mermaid'); // heavy; only loaded on this page
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'antiscript', // 'strict' would disable the click-to-GitHub links
          theme: 'base',
          flowchart: { curve: 'basis', htmlLabels: true, padding: 12, nodeSpacing: 40, rankSpacing: 55 },
          themeVariables: { fontSize: '13px', lineColor: '#9ca3af', primaryTextColor: '#111827', edgeLabelBackground: '#ffffff' },
        });
        const { svg, bindFunctions } = await mermaid.render(`arch-${++renderSeq}`, code);
        if (cancelled || !host.current) return;
        host.current.innerHTML = svg;
        bindFunctions?.(host.current);
        const el = host.current.querySelector('svg');
        setBaseWidth(el?.viewBox.baseVal.width ?? 0);
        setError(null);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      }
    })();
    return () => { cancelled = true; };
  }, [code]);

  // Mermaid sizes the svg to its container; free it so zoom maps to real pixels.
  useEffect(() => {
    const el = host.current?.querySelector('svg');
    if (!el || !baseWidth) return;
    el.style.maxWidth = 'none';
    el.style.width = `${baseWidth * zoom}px`;
    el.style.height = 'auto';
  }, [zoom, baseWidth]);

  if (!arch) {
    return (
      <div className="h-full w-full glass-panel flex items-center justify-center p-8 text-center text-sm text-black/70">
        No architecture diagram for this analysis. The AI step may have failed or this result was cached before it existed — re-run the analysis.
      </div>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked; nothing to do */ }
  };

  return (
    <div className="h-full w-full glass-panel flex flex-col relative overflow-hidden">
      <div className="px-5 py-3 border-b border-black/10 flex items-start gap-4">
        <div className="flex-1">
          <h2 className="text-sm font-semibold">System Architecture</h2>
          <p className="text-xs text-black/70 mt-1 max-w-4xl">{arch.overview}</p>
          <p className="text-[10px] text-black/50 mt-1">Click a component to open it on GitHub</p>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <button onClick={() => setZoom((z) => Math.max(0.3, z - 0.15))} className="px-2 py-1 rounded border border-black/20 hover:bg-black/5" aria-label="Zoom out">−</button>
          <span className="w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(3, z + 0.15))} className="px-2 py-1 rounded border border-black/20 hover:bg-black/5" aria-label="Zoom in">+</button>
          <button onClick={copy} className="ml-2 px-2 py-1 rounded border border-black/20 hover:bg-black/5">{copied ? 'Copied' : 'Copy Mermaid'}</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-[#f3eeff] p-6">
        {error && <div className="text-sm text-red-700 mb-3">Diagram failed to render: {error}</div>}
        <div ref={host} className="mx-auto w-fit" />
      </div>
    </div>
  );
}
