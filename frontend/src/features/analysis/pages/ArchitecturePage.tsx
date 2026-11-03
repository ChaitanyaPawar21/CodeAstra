import { useEffect, useMemo, useRef, useState } from 'react';
import type { Architecture, LayerType } from '../../../shared/types/dashboard';
import { useAnalysis } from '../hooks/useAnalysis';
import { buildArchitecture, toArchitecture, type ArchTier } from '../lib/architecture';

// One colour per group, cycled (fill, stroke, text). Mermaid can't read Tailwind
// classes, so these mirror the pastel scales in tailwind.config.js by hand — the
// stock cool palette read as a different product dropped into the yellow UI.
const PALETTE = [
  ['#FBEFC0', '#E4C34A', '#4A3A08'], // butter
  ['#AFCDB4', '#5A8568', '#17351F'], // sage
  ['#EDC4A6', '#CB8455', '#4A2411'], // clay
  ['#CDBBDC', '#7E6397', '#2E1C3F'], // lilac
  ['#A7D0D1', '#4E888B', '#123133'], // teal
  ['#F6CAD9', '#D16B90', '#44101F'], // rose
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
    out.push('  end', `  style ${mid('g_' + g.id)} fill:#FDF8DC,stroke:#D9CFA0,color:#3A3422`);
    const [fill, stroke, color] = PALETTE[i % PALETTE.length];
    out.push(`  classDef grp${i} fill:${fill},stroke:${stroke},color:${color},stroke-width:1.5px`);
    const ids = arch.components.filter((c) => c.group === g.id).map((c) => mid(c.id));
    if (ids.length) out.push(`  class ${ids.join(',')} grp${i}`);
  });

  const loose = arch.components.filter((c) => !c.group);
  loose.forEach((c) => out.push(`  ${node(c)}`));
  out.push('  classDef ext fill:#FFFDF0,stroke:#111827,color:#111827,stroke-width:1.5px');
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
  const view = useMemo(() => {
    if (!analysisData?.dependencyGraph?.nodes?.length) return null;
    const { dependencyGraph: dep, entryPoints, folderHierarchy } = analysisData;
    return buildArchitecture({
      nodes: dep.nodes,
      layerFlow: dep.layerFlow,
      entryPoints,
      folderHierarchy,
    });
  }, [analysisData]);

  const code = useMemo(
    () => (view ? toMermaid(toArchitecture(view), analysisData!.repoUrl) : ''),
    [view, analysisData],
  );

  const host = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [baseWidth, setBaseWidth] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selected, setSelected] = useState<LayerType | null>(null);

  // Drag-to-pan. The browser already handles wheel, shift+wheel and the scrollbars, so this
  // only adds grab-and-drag, which it does not. Touch is left to native scrolling.
  const scroller = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const panned = useRef(false);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scroller.current;
    if (!el || e.pointerType === 'touch' || e.button !== 0) return;
    if ((e.target as Element).closest('a')) return; // let click-through links win
    drag.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop };
    panned.current = false;
    el.setPointerCapture(e.pointerId);
    el.style.cursor = 'grabbing';
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scroller.current;
    const d = drag.current;
    if (!el || !d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    // A few px of slop, so a click that selects a layer is not read as a pan.
    if (!panned.current && Math.abs(dx) + Math.abs(dy) > 4) panned.current = true;
    if (!panned.current) return;
    el.scrollLeft = d.left - dx;
    el.scrollTop = d.top - dy;
  };

  const endPan = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scroller.current;
    if (!el || !drag.current) return;
    el.releasePointerCapture(e.pointerId);
    el.style.cursor = '';
    drag.current = null;
  };

  // Longest id first: "n_api" is a prefix of "n_api_client".
  const idToLayer = useMemo(() => {
    const pairs = (view?.tiers ?? []).map((t) => [mid(t.layer), t.layer] as const);
    return pairs.sort((a, b) => b[0].length - a[0].length);
  }, [view]);

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
          themeVariables: { fontSize: '13px', lineColor: '#7A6F45', primaryTextColor: '#111827', edgeLabelBackground: '#FFFBE0' },
        });
        const { svg, bindFunctions } = await mermaid.render(`arch-${++renderSeq}`, code);
        if (cancelled || !host.current) return;
        host.current.innerHTML = svg;
        bindFunctions?.(host.current);
        // Clicking a tier in the diagram selects it in the side panel. Done by walking the
        // rendered nodes rather than Mermaid's `click ... call`, which needs securityLevel
        // 'loose' - too much trust for labels that come out of a stranger's repo.
        host.current.querySelectorAll<SVGGElement>('g.node').forEach((g) => {
          const hit = idToLayer.find(([nodeId]) => g.id.includes(nodeId));
          if (!hit) return;
          g.style.cursor = 'pointer';
          g.addEventListener('click', () => {
            if (!panned.current) setSelected(hit[1]); // the click that ended a pan is not a pick
          });
        });
        const el = host.current.querySelector('svg');
        setBaseWidth(el?.viewBox.baseVal.width ?? 0);
        setError(null);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      }
    })();
    return () => { cancelled = true; };
  }, [code, idToLayer]);

  // Mermaid sizes the svg to its container; free it so zoom maps to real pixels.
  useEffect(() => {
    const el = host.current?.querySelector('svg');
    if (!el || !baseWidth) return;
    el.style.maxWidth = 'none';
    el.style.width = `${baseWidth * zoom}px`;
    el.style.height = 'auto';
  }, [zoom, baseWidth]);

  if (!view) {
    return (
      <div className="h-full w-full glass-panel flex items-center justify-center p-8 text-center text-sm text-black/70">
        No dependency graph for this analysis — nothing to draw. Re-run the analysis.
      </div>
    );
  }

  const repoUrl = analysisData!.repoUrl;
  const tier = view.tiers.find((t) => t.layer === selected) ?? null;

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
          <p className="text-xs text-black/70 mt-1 max-w-4xl">{view.overview}</p>
          <p className="text-[10px] text-black/60 mt-1">
            Click a layer to see what it does and which files are in it · drag to pan, shift + scroll to move sideways
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <button onClick={() => setZoom((z) => Math.max(0.3, z - 0.15))} className="px-2 py-1 rounded border border-black/20 hover:bg-black/5" aria-label="Zoom out">−</button>
          <span className="w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(3, z + 0.15))} className="px-2 py-1 rounded border border-black/20 hover:bg-black/5" aria-label="Zoom in">+</button>
          <button onClick={copy} className="ml-2 px-2 py-1 rounded border border-black/20 hover:bg-black/5">{copied ? 'Copied' : 'Copy Mermaid'}</button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div
          ref={scroller}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPan}
          onPointerCancel={endPan}
          className="flex-1 overflow-auto overscroll-contain select-none cursor-grab bg-[#FFFBE0] p-6"
        >
          {error && <div className="text-sm text-red-700 mb-3">Diagram failed to render: {error}</div>}
          <div ref={host} className="mx-auto w-fit" />
        </div>

        <aside className="w-80 shrink-0 border-l border-black/10 overflow-auto p-4 text-xs">
          {tier ? (
            <TierPanel tier={tier} repoUrl={repoUrl} onSelect={setSelected} onBack={() => setSelected(null)} />
          ) : (
            <Orientation view={view} repoUrl={repoUrl} onSelect={setSelected} />
          )}
        </aside>
      </div>
    </div>
  );
}

const FileLink = ({ repoUrl, path }: { repoUrl: string; path: string }) => (
  <a
    href={githubHref(repoUrl, path)}
    target="_blank"
    rel="noreferrer"
    className="font-mono text-[11px] text-indigo-700 hover:underline break-all"
  >
    {path}
  </a>
);

/** Default panel: the day-one reading order. */
function Orientation({
  view,
  repoUrl,
  onSelect,
}: {
  view: ReturnType<typeof buildArchitecture>;
  repoUrl: string;
  onSelect: (l: LayerType) => void;
}) {
  return (
    <div className="space-y-5">
      <section>
        <h3 className="font-semibold text-sm">I just cloned this. Where do I start?</h3>
        {view.entry.file ? (
          <p className="mt-2 text-black/70">
            Open <FileLink repoUrl={repoUrl} path={view.entry.file} /> first — that is where the
            process boots.
          </p>
        ) : (
          <p className="mt-2 text-black/60">No entry point was identified for this repo.</p>
        )}
      </section>

      {view.entry.flow.length > 0 && (
        <section>
          <h4 className="font-semibold uppercase tracking-wide text-[10px] text-black/60">Startup flow</h4>
          <ol className="mt-2 space-y-1.5">
            {view.entry.flow.map((step, i) => (
              <li key={i} className="flex gap-2 text-black/70">
                <span className="shrink-0 w-4 text-right tabular-nums text-black/60">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {view.keyFiles.length > 0 && (
        <section>
          <h4 className="font-semibold uppercase tracking-wide text-[10px] text-black/60">Files that matter most</h4>
          <p className="mt-1 text-[10px] text-black/60">Ranked by how many other files import them.</p>
          <ul className="mt-2 space-y-1.5">
            {view.keyFiles.map((f) => (
              <li key={f.id}>
                <FileLink repoUrl={repoUrl} path={f.path} />
                <span className="ml-1 text-black/60">
                  · {f.layer} · imported by {f.fanIn}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h4 className="font-semibold uppercase tracking-wide text-[10px] text-black/60">Layers, in reading order</h4>
        <ul className="mt-2 space-y-1">
          {view.tiers.map((t) => (
            <li key={t.layer}>
              <button
                onClick={() => onSelect(t.layer)}
                className={`w-full text-left px-2 py-1.5 rounded hover:bg-black/5 flex items-baseline justify-between gap-2 ${t.dim ? 'opacity-50' : ''}`}
              >
                <span className="font-mono">{t.label}</span>
                <span className="text-black/60 tabular-nums">{t.fileCount}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-1 text-[10px] text-black/60">Dimmed layers are support code — skip them on the first pass.</p>
      </section>

      {view.externals.length > 0 && (
        <section>
          <h4 className="font-semibold uppercase tracking-wide text-[10px] text-black/60">Leans on</h4>
          <p className="mt-2 text-black/70">{view.externals.join(' · ')}</p>
        </section>
      )}
    </div>
  );
}

/** Per-layer panel: what it is, the repo's evidence for it, its files, and the next hop. */
function TierPanel({
  tier,
  repoUrl,
  onSelect,
  onBack,
}: {
  tier: ArchTier;
  repoUrl: string;
  onSelect: (l: LayerType) => void;
  onBack: () => void;
}) {
  const shown = tier.files.slice(0, 12);
  return (
    <div className="space-y-5">
      <button onClick={onBack} className="text-black/60 hover:text-black">← Overview</button>

      <section>
        <h3 className="font-mono font-semibold text-sm">
          {tier.label} <span className="font-sans font-normal text-black/60">({tier.fileCount} files{tier.loc ? `, ${tier.loc} loc` : ''})</span>
        </h3>
        <p className="mt-2 text-black/70">{tier.blurb}</p>
      </section>

      {tier.notes.length > 0 && (
        <section>
          <h4 className="font-semibold uppercase tracking-wide text-[10px] text-black/60">In this repo</h4>
          <ul className="mt-2 space-y-1.5 text-black/70">
            {tier.notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </section>
      )}

      <section>
        <h4 className="font-semibold uppercase tracking-wide text-[10px] text-black/60">Files</h4>
        <ul className="mt-2 space-y-1.5">
          {shown.map((f) => (
            <li key={f.id}>
              <FileLink repoUrl={repoUrl} path={f.path} />
              {f.fanIn > 0 && <span className="ml-1 text-black/60">· imported by {f.fanIn}</span>}
            </li>
          ))}
        </ul>
        {tier.files.length > shown.length && (
          <p className="mt-1 text-black/60">+ {tier.files.length - shown.length} more</p>
        )}
        {shown[0]?.layerReason && (
          <p className="mt-2 text-[10px] text-black/60">Classified by: {shown[0].layerReason}</p>
        )}
      </section>

      {tier.outgoing.length > 0 && (
        <section>
          <h4 className="font-semibold uppercase tracking-wide text-[10px] text-black/60">Calls into</h4>
          <ul className="mt-2 space-y-1">
            {tier.outgoing.map((e) => (
              <li key={e.to}>
                <button onClick={() => onSelect(e.to)} className="hover:underline font-mono">{e.to}</button>
                <span className="text-black/60"> · {e.count} import{e.count === 1 ? '' : 's'}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tier.incoming.length > 0 && (
        <section>
          <h4 className="font-semibold uppercase tracking-wide text-[10px] text-black/60">Called from</h4>
          <ul className="mt-2 space-y-1">
            {tier.incoming.map((e) => (
              <li key={e.from}>
                <button onClick={() => onSelect(e.from)} className="hover:underline font-mono">{e.from}</button>
                <span className="text-black/60"> · {e.count} import{e.count === 1 ? '' : 's'}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
