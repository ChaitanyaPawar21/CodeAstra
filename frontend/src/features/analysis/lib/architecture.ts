// Builds the architecture view from the deterministic repograph output (m3) plus the
// already-paid-for m1/m2 prose. No LLM call, no backend change: every number here is
// derived from parsed imports, so the diagram is exact and repeatable.
import type {
  Architecture,
  EntryPointStep,
  FolderHierarchyNode,
  GraphNode,
  LayerFlowEntry,
  LayerType,
} from '../../../shared/types/dashboard';

export type GroupId = 'start' | 'client' | 'server' | 'data' | 'support';

export const GROUP_LABEL: Record<GroupId, string> = {
  start: 'Start here',
  client: 'Client',
  server: 'Server',
  data: 'Data',
  support: 'Support · skim later',
};

interface LayerMeta {
  label: string;
  blurb: string;
  group: GroupId;
  shape: Architecture['components'][number]['shape'];
  kind: Architecture['components'][number]['kind'];
  dim?: boolean; // "you can ignore this on day one"
}

// Reading order for a new joiner: entry first, then the request as it travels.
// Array order IS the rank, so laying out tiers never needs a topological sort and a
// cyclic layerFlow cannot hang the layout.
export const LAYER_ORDER: LayerType[] = [
  'entry',
  'ui-page',
  'ui-component',
  'state',
  'api-client',
  'api',
  'route',
  'middleware',
  'controller',
  'service',
  'repository',
  'database',
  'model',
  'config',
  'util',
  'utility',
  'types',
  'other',
  'test',
];

export const LAYER_INFO: Record<LayerType, LayerMeta> = {
  entry: {
    label: 'entry',
    blurb:
      'Where the process actually starts. Boots the app, wires everything together, then hands off. Read this first.',
    group: 'start',
    shape: 'stadium',
    kind: 'infra',
  },
  'ui-page': {
    label: 'ui-page',
    blurb:
      'One screen each, mapped to a URL. Fetches what it needs and arranges components. Start here to find the screen you care about.',
    group: 'client',
    shape: 'rect',
    kind: 'ui',
  },
  'ui-component': {
    label: 'ui-component',
    blurb:
      'Reusable pieces of interface. They take props and render; they should not know about the network.',
    group: 'client',
    shape: 'rect',
    kind: 'ui',
  },
  state: {
    label: 'state',
    blurb:
      'Client-side memory: contexts, stores, hooks. Where a page keeps data between renders and shares it with other pages.',
    group: 'client',
    shape: 'rect',
    kind: 'ui',
  },
  'api-client': {
    label: 'api-client',
    blurb:
      'The client half of the network boundary. Every outgoing HTTP call should funnel through here, which makes it the fastest way to see what the frontend asks the server for.',
    group: 'client',
    shape: 'hexagon',
    kind: 'api',
  },
  api: {
    label: 'api',
    blurb: 'Network boundary between client and server.',
    group: 'client',
    shape: 'hexagon',
    kind: 'api',
  },
  route: {
    label: 'route',
    blurb:
      'A thin HTTP surface. Maps URLs and verbs to controllers and attaches middleware. Holds no business logic, so it is the quickest list of what the server can do.',
    group: 'server',
    shape: 'rect',
    kind: 'api',
  },
  middleware: {
    label: 'middleware',
    blurb:
      'Runs before the handler: auth, parsing, logging. Can stop a request before it ever reaches a controller, which is why an unexplained 401 usually lives here.',
    group: 'server',
    shape: 'rect',
    kind: 'service',
  },
  controller: {
    label: 'controller',
    blurb:
      'Translates HTTP into a call on a service, and a service result back into a response. Validation and status codes belong here; real logic does not.',
    group: 'server',
    shape: 'rect',
    kind: 'api',
  },
  service: {
    label: 'service',
    blurb:
      'The business logic. Knows nothing about HTTP and nothing about the database driver, so this is where behaviour is actually decided. Usually the densest code in the repo.',
    group: 'server',
    shape: 'rect',
    kind: 'service',
  },
  repository: {
    label: 'repository',
    blurb:
      'The only code that talks to the database. Turns domain calls into queries so services stay storage-agnostic.',
    group: 'data',
    shape: 'rect',
    kind: 'data',
  },
  database: {
    label: 'database',
    blurb: 'Persistent storage.',
    group: 'data',
    shape: 'cylinder',
    kind: 'data',
  },
  model: {
    label: 'model',
    blurb:
      'The shape of stored data: schemas and entities. Read these to learn the domain vocabulary before you read any logic.',
    group: 'data',
    shape: 'cylinder',
    kind: 'data',
  },
  config: {
    label: 'config',
    blurb:
      'Environment, connections, framework wiring. Boring, but needed to run the thing locally.',
    group: 'support',
    shape: 'rect',
    kind: 'infra',
  },
  util: {
    label: 'util',
    blurb: 'Small shared helpers. Widely imported and rarely interesting; skip on the first pass.',
    group: 'support',
    shape: 'rect',
    kind: 'other',
    dim: true,
  },
  utility: {
    label: 'utility',
    blurb: 'Small shared helpers. Skip on the first pass.',
    group: 'support',
    shape: 'rect',
    kind: 'other',
    dim: true,
  },
  types: {
    label: 'types',
    blurb: 'Type declarations only, no runtime behaviour. A reference, not reading.',
    group: 'support',
    shape: 'rect',
    kind: 'other',
    dim: true,
  },
  other: {
    label: 'other',
    blurb:
      'Did not match any layer convention. Could be anything; worth a glance once the rest makes sense.',
    group: 'support',
    shape: 'rect',
    kind: 'other',
    dim: true,
  },
  test: {
    label: 'test',
    blurb:
      'Tests. Not part of the running system, but the best description of intended behaviour once you need one.',
    group: 'support',
    shape: 'rect',
    kind: 'other',
    dim: true,
  },
};

export interface ArchFile {
  id: string;
  path: string;
  fanIn: number;
  loc?: number;
  layerReason?: string;
}

export interface ArchTier {
  layer: LayerType;
  label: string;
  blurb: string;
  group: GroupId;
  dim: boolean;
  files: ArchFile[]; // fan-in desc
  fileCount: number;
  loc: number;
  outgoing: Array<{ to: LayerType; count: number }>;
  incoming: Array<{ from: LayerType; count: number }>;
  notes: string[]; // folder purposes from m1, when they cover this tier
}

export interface ArchView {
  overview: string;
  tiers: ArchTier[];
  edges: Array<{ from: LayerType; to: LayerType; count: number }>;
  groups: Array<{ id: GroupId; label: string }>;
  entry: { file: string | null; flow: string[] };
  keyFiles: Array<{ id: string; path: string; fanIn: number; layer: LayerType }>;
  externals: string[];
}

export interface ArchInput {
  nodes: GraphNode[];
  layerFlow?: LayerFlowEntry[];
  entryPoints?: EntryPointStep[];
  folderHierarchy?: FolderHierarchyNode[];
}

/** Unknown / legacy layer ids fall into "other" rather than breaking the layout. */
const norm = (t: string): LayerType => (t in LAYER_INFO ? (t as LayerType) : 'other');

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

export function buildArchitecture({
  nodes,
  layerFlow = [],
  entryPoints = [],
  folderHierarchy = [],
}: ArchInput): ArchView {
  const byLayer = new Map<LayerType, ArchFile[]>();
  for (const n of nodes) {
    const layer = norm(n.type);
    const file: ArchFile = {
      id: n.id,
      path: n.label,
      fanIn: n.importedBy?.length ?? 0,
      loc: n.loc,
      layerReason: n.layerReason,
    };
    const bucket = byLayer.get(layer);
    if (bucket) bucket.push(file);
    else byLayer.set(layer, [file]);
  }
  for (const files of byLayer.values()) {
    files.sort((a, b) => b.fanIn - a.fanIn || a.path.localeCompare(b.path));
  }

  // Only layers that actually have files become tiers, in reading order.
  const present = LAYER_ORDER.filter((l) => byLayer.has(l));
  const presentSet = new Set(present);

  // layerFlow, normalised: self-loops dropped (a service importing a service is not a hop),
  // and an endpoint whose layer has no files cannot be drawn.
  const edges = layerFlow
    .map((e) => ({ from: norm(e.from), to: norm(e.to), count: e.count }))
    .filter((e) => e.from !== e.to && presentSet.has(e.from) && presentSet.has(e.to))
    .sort((a, b) => b.count - a.count);

  const isCount = (s: string) => /^\d+ files?$/.test(s.trim());
  const notesFor = (files: ArchFile[]) =>
    folderHierarchy
      .filter((f) => f.name && f.explanation && !isCount(f.explanation))
      .filter((f) => {
        const dir = f.name.replace(/\/+$/, '');
        return files.some((x) => x.path === dir || x.path.startsWith(`${dir}/`));
      })
      .slice(0, 2)
      .map((f) => `${f.name} — ${f.explanation}`);

  const tiers: ArchTier[] = present.map((layer) => {
    const meta = LAYER_INFO[layer];
    const files = byLayer.get(layer)!;
    return {
      layer,
      label: meta.label,
      blurb: meta.blurb,
      group: meta.group,
      dim: meta.dim ?? false,
      files,
      fileCount: files.length,
      loc: files.reduce((sum, f) => sum + (f.loc ?? 0), 0),
      outgoing: edges.filter((e) => e.from === layer).map((e) => ({ to: e.to, count: e.count })),
      incoming: edges.filter((e) => e.to === layer).map((e) => ({ from: e.from, count: e.count })),
      notes: notesFor(files),
    };
  });

  const groups = (['start', 'client', 'server', 'data', 'support'] as GroupId[])
    .filter((g) => tiers.some((t) => t.group === g))
    .map((g) => ({ id: g, label: GROUP_LABEL[g] }));

  // m2 gives a real entry file plus prose steps. When m2 is missing, transformReal falls
  // back to listing entry-layer *file paths* in the same field - those are not a flow, so
  // anything that is a known file path is dropped from the step list.
  const paths = new Set(nodes.map((n) => n.label));
  const entryFile = entryPoints[0]?.label ?? byLayer.get('entry')?.[0]?.path ?? null;
  const flow = entryPoints
    .slice(1)
    .map((s) => s.label)
    .filter((l) => l && !paths.has(l));

  const keyFiles = nodes
    .filter((n) => (n.importedBy?.length ?? 0) > 0 && !(LAYER_INFO[norm(n.type)].dim ?? false))
    .sort(
      (a, b) => b.importedBy!.length - a.importedBy!.length || a.label.localeCompare(b.label),
    )
    .slice(0, 5)
    .map((n) => ({ id: n.id, path: n.label, fanIn: n.importedBy!.length, layer: norm(n.type) }));

  const extCount = new Map<string, number>();
  for (const n of nodes) {
    for (const p of n.externalPackages ?? []) extCount.set(p, (extCount.get(p) ?? 0) + 1);
  }
  const externals = [...extCount.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([p]) => p);

  const spine = tiers.filter((t) => !t.dim).map((t) => t.label);
  const overview = `${plural(nodes.length, 'file')} across ${plural(
    tiers.length,
    'layer',
  )}, ${plural(edges.length, 'cross-layer hop')}. Reading order: ${spine.join(' → ') || 'n/a'}.`;

  return { overview, tiers, edges, groups, entry: { file: entryFile, flow }, keyFiles, externals };
}

/** Adapts the view to the existing Architecture shape so toMermaid is reused unchanged. */
export function toArchitecture(view: ArchView): Architecture {
  return {
    overview: view.overview,
    groups: view.groups.map((g) => ({ id: g.id, label: g.label })),
    components: view.tiers.map((t) => ({
      id: t.layer,
      label: t.label,
      role: plural(t.fileCount, 'file'),
      description: t.blurb,
      group: t.group,
      shape: LAYER_INFO[t.layer].shape,
      kind: LAYER_INFO[t.layer].kind,
      paths: [], // nodes are layers, not files: no click-through to GitHub
    })),
    edges: view.edges.map((e) => ({ from: e.from, to: e.to, label: `${e.count}` })),
  };
}
