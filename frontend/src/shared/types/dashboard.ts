export interface TechStack {
  name: string;
  color: string;
}

export interface SummaryData {
  title: string;
  techStack: TechStack[];
  totalFiles: number;
  complexity: number;
  description: string;
  bulletPoints: string[];
}

export interface FolderHierarchyNode {
  name: string;
  explanation: string;
  filesCount: number;
  isStarred?: boolean;
}

export interface EntryPointStep {
  label: string;
  subLabel?: string;
}

export interface CriticalFile {
  name: string;
  importance: string;
  riskLevel: string;
  colorTheme: 'blue' | 'purple' | 'yellow' | 'red';
  isStarred?: boolean;
}

export interface RequestLifecycleStep {
  label: string;
  iconType: 'client' | 'code' | 'server' | 'database' | 'response';
}

export interface AIInsight {
  title: string;
  description: string;
  iconType: 'module' | 'bottleneck' | 'risk' | 'suggestion' | 'connection';
  colorTheme: 'blue' | 'red' | 'purple' | 'yellow' | 'cyan';
}

// Layer set produced by the backend repograph pipeline.
export type LayerType =
  | 'entry' | 'route' | 'controller' | 'service' | 'repository' | 'model'
  | 'middleware' | 'config' | 'util' | 'types' | 'ui-page' | 'ui-component'
  | 'state' | 'api-client' | 'test' | 'other'
  // legacy values kept for sample/mock data
  | 'utility' | 'database' | 'api';

export interface GraphNode {
  id: string;
  label: string; // file path
  type: LayerType; // layer
  color?: string; // legacy (sample data)
  language?: string;
  layerReason?: string;
  loc?: number;
  exports?: string[];
  externalPackages?: string[];
  imports?: string[]; // node ids
  importedBy?: string[]; // node ids
  // legacy per-node metadata, only present in sample data
  metadata?: {
    dependencies: string[];
    importedBy: string[];
    aiSummary: string;
    complexityScore: number;
    riskLevel: string;
    relatedModules: string[];
  };
}

export interface GraphEdge {
  source: string;
  target: string;
  animated?: boolean;
  label?: string;
  typeOnly?: boolean;
  cyclic?: boolean;
}

export interface LayerFlowEntry {
  from: string;
  to: string;
  count: number;
}

export interface GraphStats {
  files: number;
  parsed: number;
  edges: number;
  unresolved: number;
  truncated: boolean;
  truncatedReason: string | null;
  unsupportedLanguages: string[];
}

export interface QuickSetupGuide {
  techStack: string[];
  installCommand: string;
  runCommand: string;
}

export interface RepositoryOverview {
  name: string;
  category: string;
  description: string;
  technologies: string[];
  architectures: string[];
  capabilities: string[];
}

export interface DashboardData {
  repoUrl: string;
  isSample?: boolean; // true when no real analysis ran (mock/sample data)
  summary: SummaryData;
  repositoryOverview: RepositoryOverview;
  quickSetupGuide: QuickSetupGuide;
  folderHierarchy: FolderHierarchyNode[];
  entryPoints: EntryPointStep[];
  criticalFiles: CriticalFile[];
  requestLifecycle: RequestLifecycleStep[];
  aiInsights: AIInsight[];
  dependencyGraph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
    cycles?: string[][];
    orphans?: string[];
    layerFlow?: LayerFlowEntry[];
    stats?: GraphStats;
  };
}
