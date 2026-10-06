import { useState } from 'react';
import { Search, ChevronDown, ChevronRight, FileCode2, GitPullRequest, Play, Copy } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useAnalysis } from '../context/AnalysisContext';

export default function RepositoryStructurePage() {
  const { repoUrl, analysisData } = useAnalysis();
  const [activeFile] = useState('app.js');

  const cleanRepoName = repoUrl.replace('https://github.com/', '').replace(/\/$/, '') || 'Target Repo';

  const fileContent = `/**
 * Repository Intelligence File View
 * Target Repository: ${cleanRepoName}
 * Analyzed by CodeAstra AI Engine
 */

import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.config.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.listen(PORT, () => {
  console.log(\`Server running for ${cleanRepoName} on port \${PORT}\`);
});
`;

  return (
    <div className="h-full flex gap-5 overflow-hidden text-slate-300">

      {/* File Tree Sidebar */}
      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-[280px] bg-[#FFFBE0] border border-black rounded-2xl flex flex-col h-full shrink-0 shadow-lg overflow-hidden"
      >
        <div className="px-5 py-4 flex items-center justify-between border-b border-black bg-[#FBF3C4]">
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">Repository Structure</span>
        </div>

        <div className="p-3.5">
          <div className="relative flex items-center bg-[#FBF3C4] rounded-xl border border-black">
            <Search className="w-4 h-4 text-slate-500 absolute left-3" />
            <input
              type="text"
              placeholder="Search files..."
              className="w-full bg-transparent border-none text-slate-300 text-xs py-2.5 pl-9 pr-3 focus:outline-none focus:ring-0 placeholder-slate-500 font-mono"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 font-mono text-xs scrollbar-hide">
          <div className="flex items-center gap-2 px-2.5 py-2 text-slate-200 cursor-pointer bg-black/[0.04] rounded-xl border border-black">
            <ChevronDown className="w-3.5 h-3.5" />
            <span className="text-indigo-400">📂</span>
            <span className="font-semibold text-slate-200">{cleanRepoName}</span>
          </div>

          {/* Dynamic Folders */}
          <div className="pl-4 space-y-1 mt-1">
            {analysisData!.folderHierarchy.map((folder, i) => (
              <div key={i} className="flex items-center justify-between px-2.5 py-1.5 text-slate-400 hover:bg-black/[0.04] rounded-xl cursor-pointer transition-colors">
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-3 h-3 text-slate-500" />
                  <span>📁</span>
                  <span>{folder.name}</span>
                </div>
                <span className="text-[10px] text-slate-500">{folder.filesCount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Repository Links */}
        <div className="p-4 border-t border-black bg-[#FBF3C4]">
          <div className="space-y-1">
            <a href={repoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-[#000000] hover:bg-black/[0.04] transition-colors">
              <FaGithub className="w-4 h-4 text-slate-400" />
              <span className="truncate">{cleanRepoName}</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-[#000000] hover:bg-black/[0.04] transition-colors">
              <GitPullRequest className="w-4 h-4" />
              Pull Requests <span className="ml-auto bg-indigo-500/10 text-black border border-indigo-500/20 py-0.5 px-2 rounded-full text-[10px]">3</span>
            </a>
          </div>
        </div>
      </motion.div>

      {/* Code Editor Area */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex-1 bg-[#FFFBE0] border border-black rounded-2xl flex flex-col overflow-hidden shadow-lg"
      >
        {/* Editor Tabs */}
        <div className="flex bg-[#FBF3C4] border-b border-black">
          <div className="px-5 py-3 bg-[#FFFBE0] border-r border-black border-t-2 border-t-indigo-500 text-xs font-mono font-semibold text-black flex items-center gap-2">
            <FileCode2 className="w-3.5 h-3.5 text-black" />
            {activeFile}
          </div>
          <div className="px-5 py-3 border-r border-black text-xs font-mono text-slate-500 flex items-center gap-2 cursor-pointer hover:bg-black/[0.04] transition-colors">
            <FileCode2 className="w-3.5 h-3.5 text-slate-600" />
            auth.routes.js
          </div>
        </div>

        {/* Editor Toolbar */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-black bg-[#FBF3C4]">
          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
            <span>src</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-300">{activeFile}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 text-slate-400 hover:text-[#000000] hover:bg-black/[0.06] rounded-lg transition-colors">
              <Play className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 text-slate-400 hover:text-[#000000] hover:bg-black/[0.06] rounded-lg transition-colors">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-auto bg-[#FBF3C4] p-5 font-mono text-xs leading-relaxed relative">
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#FBF3C4] border-r border-black flex flex-col items-end py-5 pr-3 text-slate-400 select-none text-[11px] font-mono">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <div className="pl-14 pt-1">
            <pre className="text-slate-100 whitespace-pre-wrap break-words">
              <code>{fileContent}</code>
            </pre>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

