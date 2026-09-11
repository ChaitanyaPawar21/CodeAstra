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

export interface GraphNode {
  id: string;
  label: string;
  type: 'route' | 'controller' | 'service' | 'model' | 'middleware' | 'config' | 'utility' | 'database' | 'api';
  color: string;
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
  };
}
