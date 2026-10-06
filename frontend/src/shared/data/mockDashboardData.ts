import type { DashboardData } from '../types/dashboard';

export const mockRepoData: DashboardData = {
  repoUrl: "https://github.com/facebook/react",
  summary: {
    title: "React",
    techStack: [
      { name: "Node.js", color: "text-green-400 bg-green-500/10 border-green-500/20" },
      { name: "React", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
      { name: "MongoDB", color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" },
      { name: "Python", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" }
    ],
    totalFiles: 254,
    complexity: 4.9,
    bulletPoints: [
      "All files analyzed",
      "Main frameworks detected",
      "Key design decisions"
    ],
    description: "AI-generated summary is a noncritical AI project program for projecting onomiotoms acoose frameworks in one another and eollnote meaning averancle semptions and estillated decisions."
  },
  quickSetupGuide: {
    techStack: ["Node.js", "MongoDB", "Docker", "Redis", "Python"],
    installCommand: "npm install",
    runCommand: "npm run dev"
  },
  repositoryOverview: {
    name: "Facebook / React",
    category: "Frontend Framework",
    description: "This repository contains the React JavaScript library used for building component-based user interfaces for modern web applications. It provides a declarative frontend architecture, reusable UI components, and efficient rendering through the virtual DOM.",
    technologies: ["React", "JavaScript", "TypeScript", "Node.js"],
    architectures: ["Component-based", "Virtual DOM", "Declarative UI"],
    capabilities: ["UI Rendering", "State Management", "Event Handling", "Server-side Rendering"]
  },
  folderHierarchy: [
    { name: "src/controllers", explanation: "Plain English explanation on section", filesCount: 23 },
    { name: "src/services", explanation: "Plain English explanation or scolder", filesCount: 18, isStarred: true },
    { name: "src/routes", explanation: "Plain English explanation on section", filesCount: 30 },
    { name: "src/middleware", explanation: "Plain English explanation or coolider", filesCount: 38, isStarred: true },
    { name: "src/models", explanation: "Plain English explanation on vestom", filesCount: 13, isStarred: true },
    { name: "src/config", explanation: "Plain English explanation or config", filesCount: 13 }
  ],
  entryPoints: [
    { label: "server.js" },
    { label: "loads environment variables" },
    { label: "connects database" },
    { label: "initializes middleware" },
    { label: "mounts API routes" },
    { label: "starts server on PORT 3000" }
  ],
  criticalFiles: [
    { name: "auth.middleware.js", importance: "Role in application", riskLevel: "If modified", colorTheme: "blue" },
    { name: "db.config.js", importance: "Role in application", riskLevel: "If modified", colorTheme: "blue", isStarred: true },
    { name: "app.js", importance: "Role in application", riskLevel: "If modified", colorTheme: "yellow", isStarred: true },
    { name: "user.controller.js", importance: "Role in application", riskLevel: "If modified", colorTheme: "red" }
  ],
  requestLifecycle: [
    { label: "Client Request", iconType: "client" },
    { label: "API Route", iconType: "code" },
    { label: "Controller", iconType: "server" },
    { label: "Service", iconType: "server" },
    { label: "Database Query", iconType: "database" },
    { label: "Response", iconType: "response" }
  ],
  aiInsights: [
    { 
      title: "Most important module detected", 
      description: "AI generated insights most important module detected, hiens, meanclodiomenss in enioism analytes.", 
      iconType: "module", 
      colorTheme: "blue" 
    },
    { 
      title: "Potential bottlenecks", 
      description: "AI generated insights a potential bottlenecks anouziou tlos high dependency files glow eestential bottlenecks.", 
      iconType: "bottleneck", 
      colorTheme: "red" 
    },
    { 
      title: "High dependency risk files", 
      description: "AI generated insights, potential dependency cre high dependency neittlocks is eos dependency risk files.", 
      iconType: "risk", 
      colorTheme: "purple" 
    },
    { 
      title: "Suggested starting points for new developers", 
      description: "AI generated insights onceights for suggested startlovesk for new project.", 
      iconType: "suggestion", 
      colorTheme: "blue" 
    },
    { 
      title: "Most connected components", 
      description: "AI generated insights, in detersitano eonosexiansnttlets, ovviing most connected components.", 
      iconType: "connection", 
      colorTheme: "cyan" 
    }
  ],
  dependencyGraph: {
    nodes: [
      { 
        id: "1", label: "api.routes.ts", type: "route", color: "blue",
        metadata: { dependencies: ["auth.controller.ts", "user.controller.ts"], importedBy: ["app.ts"], aiSummary: "Main API router defining public and protected endpoints.", complexityScore: 3.5, riskLevel: "Medium", relatedModules: ["routes/"] }
      },
      { 
        id: "2", label: "auth.controller.ts", type: "controller", color: "purple",
        metadata: { dependencies: ["auth.service.ts", "jwt.util.ts"], importedBy: ["api.routes.ts"], aiSummary: "Handles authentication requests, login, and token generation.", complexityScore: 7.2, riskLevel: "High", relatedModules: ["auth/"] }
      },
      { 
        id: "3", label: "user.controller.ts", type: "controller", color: "purple",
        metadata: { dependencies: ["user.service.ts"], importedBy: ["api.routes.ts"], aiSummary: "Manages user profile retrieval and updates.", complexityScore: 4.1, riskLevel: "Low", relatedModules: ["users/"] }
      },
      { 
        id: "4", label: "auth.service.ts", type: "service", color: "green",
        metadata: { dependencies: ["user.model.ts", "redis.client.ts"], importedBy: ["auth.controller.ts"], aiSummary: "Core business logic for user authentication and session management.", complexityScore: 8.5, riskLevel: "Critical", relatedModules: ["auth/", "cache/"] }
      },
      { 
        id: "5", label: "user.service.ts", type: "service", color: "green",
        metadata: { dependencies: ["user.model.ts"], importedBy: ["user.controller.ts"], aiSummary: "Business logic for user management.", complexityScore: 5.0, riskLevel: "Medium", relatedModules: ["users/"] }
      },
      { 
        id: "6", label: "user.model.ts", type: "model", color: "yellow",
        metadata: { dependencies: ["db.config.ts"], importedBy: ["auth.service.ts", "user.service.ts"], aiSummary: "Mongoose schema and model definition for User.", complexityScore: 2.1, riskLevel: "Low", relatedModules: ["models/"] }
      },
      { 
        id: "7", label: "auth.middleware.ts", type: "middleware", color: "cyan",
        metadata: { dependencies: ["jwt.util.ts"], importedBy: ["api.routes.ts"], aiSummary: "Express middleware verifying JWT tokens for protected routes.", complexityScore: 4.8, riskLevel: "High", relatedModules: ["middleware/"] }
      },
      { 
        id: "8", label: "db.config.ts", type: "config", color: "orange",
        metadata: { dependencies: [], importedBy: ["user.model.ts", "app.ts"], aiSummary: "Database connection setup and pooling configuration.", complexityScore: 1.5, riskLevel: "Critical", relatedModules: ["config/"] }
      },
      { 
        id: "9", label: "jwt.util.ts", type: "utility", color: "pink",
        metadata: { dependencies: [], importedBy: ["auth.controller.ts", "auth.middleware.ts"], aiSummary: "Helper functions for signing and verifying JSON Web Tokens.", complexityScore: 3.0, riskLevel: "Medium", relatedModules: ["utils/"] }
      },
      { 
        id: "10", label: "redis.client.ts", type: "database", color: "red",
        metadata: { dependencies: ["config.ts"], importedBy: ["auth.service.ts"], aiSummary: "Redis connection client for fast session and cache storage.", complexityScore: 3.2, riskLevel: "High", relatedModules: ["cache/"] }
      }
    ],
    edges: [
      { source: "1", target: "7", label: "uses", animated: true },
      { source: "1", target: "2", label: "routes to" },
      { source: "1", target: "3", label: "routes to" },
      { source: "7", target: "9", label: "verifies with" },
      { source: "2", target: "4", label: "calls" },
      { source: "2", target: "9", label: "signs with" },
      { source: "3", target: "5", label: "calls" },
      { source: "4", target: "6", label: "queries" },
      { source: "4", target: "10", label: "caches to" },
      { source: "5", target: "6", label: "queries" },
      { source: "6", target: "8", label: "connects via" }
    ]
  }
};
