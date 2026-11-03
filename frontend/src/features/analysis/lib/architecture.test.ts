import { describe, expect, it } from 'vitest';
import type { GraphNode, LayerType } from '../../../shared/types/dashboard';
import { buildArchitecture, toArchitecture } from './architecture';

const node = (id: string, type: string, extra: Partial<GraphNode> = {}): GraphNode => ({
  id,
  label: id,
  type: type as LayerType,
  importedBy: [],
  imports: [],
  ...extra,
});

describe('buildArchitecture', () => {
  it('orders tiers by reading order, not by input order', () => {
    const view = buildArchitecture({
      nodes: [
        node('m.ts', 'model'),
        node('s.ts', 'service'),
        node('r.ts', 'route'),
        node('c.ts', 'controller'),
        node('i.ts', 'entry'),
      ],
    });
    expect(view.tiers.map((t) => t.layer)).toEqual([
      'entry',
      'route',
      'controller',
      'service',
      'model',
    ]);
  });

  it('omits layers with no files', () => {
    const view = buildArchitecture({ nodes: [node('r.ts', 'route')] });
    expect(view.tiers).toHaveLength(1);
    expect(view.tiers.map((t) => t.layer)).not.toContain('service');
  });

  it('buckets unknown layer ids into other instead of throwing', () => {
    const view = buildArchitecture({ nodes: [node('x.ts', 'not-a-layer')] });
    expect(view.tiers.map((t) => t.layer)).toEqual(['other']);
  });

  it('keeps both directions of a cyclic layerFlow and terminates', () => {
    const view = buildArchitecture({
      nodes: [node('s.ts', 'service'), node('d.ts', 'repository')],
      layerFlow: [
        { from: 'service', to: 'repository', count: 4 },
        { from: 'repository', to: 'service', count: 1 },
      ],
    });
    expect(view.edges).toEqual([
      { from: 'service', to: 'repository', count: 4 },
      { from: 'repository', to: 'service', count: 1 },
    ]);
    const service = view.tiers.find((t) => t.layer === 'service')!;
    expect(service.outgoing).toEqual([{ to: 'repository', count: 4 }]);
    expect(service.incoming).toEqual([{ from: 'repository', count: 1 }]);
  });

  it('drops self-loops and edges whose endpoint layer has no files', () => {
    const view = buildArchitecture({
      nodes: [node('s.ts', 'service')],
      layerFlow: [
        { from: 'service', to: 'service', count: 9 },
        { from: 'service', to: 'repository', count: 3 },
      ],
    });
    expect(view.edges).toEqual([]);
  });

  it('keeps m2 prose steps as the startup flow', () => {
    const view = buildArchitecture({
      nodes: [node('server.ts', 'entry')],
      entryPoints: [
        { label: 'server.ts' },
        { label: 'loads env config' },
        { label: 'connects to MongoDB' },
      ],
    });
    expect(view.entry.file).toBe('server.ts');
    expect(view.entry.flow).toEqual(['loads env config', 'connects to MongoDB']);
  });

  it('does not mistake the no-m2 file-path fallback for a flow', () => {
    const view = buildArchitecture({
      nodes: [node('server.ts', 'entry'), node('worker.ts', 'entry')],
      entryPoints: [{ label: 'server.ts' }, { label: 'worker.ts' }],
    });
    expect(view.entry.file).toBe('server.ts');
    expect(view.entry.flow).toEqual([]);
  });

  it('ranks key files by fan-in and excludes support layers', () => {
    const view = buildArchitecture({
      nodes: [
        node('util.ts', 'util', { importedBy: ['a', 'b', 'c', 'd'] }),
        node('svc.ts', 'service', { importedBy: ['a', 'b'] }),
        node('model.ts', 'model', { importedBy: ['a'] }),
        node('lonely.ts', 'controller', { importedBy: [] }),
      ],
    });
    expect(view.keyFiles.map((f) => f.path)).toEqual(['svc.ts', 'model.ts']);
  });

  it('only shows m1 folder notes for folders that cover the tier', () => {
    const view = buildArchitecture({
      nodes: [node('src/services/ai.ts', 'service'), node('src/routes/r.ts', 'route')],
      folderHierarchy: [
        { name: 'src/services', explanation: 'business logic', filesCount: 1 },
        { name: 'src/routes', explanation: 'http surface', filesCount: 1 },
        { name: 'src/util', explanation: '4 files', filesCount: 4 }, // count-only = no real purpose
      ],
    });
    expect(view.tiers.find((t) => t.layer === 'service')!.notes).toEqual([
      'src/services — business logic',
    ]);
    expect(view.tiers.find((t) => t.layer === 'route')!.notes).toEqual(['src/routes — http surface']);
  });
});

describe('toArchitecture', () => {
  it('produces one component per tier with no GitHub click paths', () => {
    const arch = toArchitecture(
      buildArchitecture({
        nodes: [node('r.ts', 'route'), node('s.ts', 'service')],
        layerFlow: [{ from: 'route', to: 'service', count: 2 }],
      }),
    );
    expect(arch.components.map((c) => c.id)).toEqual(['route', 'service']);
    expect(arch.components.every((c) => c.paths.length === 0)).toBe(true);
    expect(arch.edges).toEqual([{ from: 'route', to: 'service', label: '2' }]);
    expect(arch.groups.map((g) => g.id)).toEqual(['server']);
  });
});
