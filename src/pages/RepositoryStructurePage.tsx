import { useState } from 'react';
import { Search, ChevronDown, ChevronRight, FileCode2, Star, GitPullRequest, Play, Copy } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function RepositoryStructurePage() {
  const [activeFile, setActiveFile] = useState('app.js');

  const fileContent = `/**
 * Main Application Entry Point
 * Initialized by CodeAstra AI
 */

import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.config.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`;

  return (
    <div className="h-full flex gap-6 overflow-hidden text-gray-300 pb-4">
      
      {/* File Tree Sidebar */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-[280px] bg-[#1E2330]/80 backdrop-blur-xl border border-white/5 rounded-xl flex flex-col h-full shrink-0 shadow-lg"
      >
        <div className="px-5 py-4 flex items-center justify-between border-b border-white/5">
          <span className="text-xs font-bold tracking-widest uppercase text-gray-400">Explorer</span>
        </div>

        <div className="p-4">
          <div className="relative flex items-center bg-[#141824] rounded-lg border border-white/5 shadow-inner">
             <Search className="w-4 h-4 text-gray-500 absolute left-3" />
             <input 
                type="text" 
                placeholder="Search files..." 
                className="w-full bg-transparent border-none text-gray-300 text-xs py-2.5 pl-9 pr-3 focus:outline-none focus:ring-0 placeholder-gray-600"
             />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 font-mono text-[11px] scrollbar-hide">
          {/* Folders */}
          <div className="flex items-center gap-2 px-2 py-2 text-gray-400 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
             <ChevronRight className="w-3.5 h-3.5" />
             <span className="text-gray-500 text-sm">📁</span>
             <span>assets</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-2 text-gray-400 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
             <ChevronRight className="w-3.5 h-3.5" />
             <span className="text-gray-500 text-sm">📁</span>
             <span>middleware</span>
          </div>
          
          {/* Expanded Folder */}
          <div className="flex items-center gap-2 px-2 py-2 text-gray-200 cursor-pointer bg-white/5 rounded-lg border border-white/5">
             <ChevronDown className="w-3.5 h-3.5" />
             <span className="text-blue-400 text-sm">📂</span>
             <span className="font-semibold text-blue-100">src</span>
          </div>
          
          {/* Files in src */}
          <div className="pl-6 space-y-0.5 mt-1 relative before:absolute before:left-4 before:top-0 before:bottom-0 before:w-px before:bg-white/10">
             <div 
               onClick={() => setActiveFile('auth.routes.js')}
               className={`flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer transition-all ${activeFile === 'auth.routes.js' ? 'bg-[#313B6B]/40 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:bg-white/5'}`}
             >
                <div className="flex items-center gap-2">
                   <FileCode2 className={`w-3.5 h-3.5 ${activeFile === 'auth.routes.js' ? 'text-blue-400' : 'text-gray-500'}`} />
                   <span>auth.routes.js</span>
                </div>
             </div>

             <div 
               onClick={() => setActiveFile('app.js')}
               className={`flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer transition-all ${activeFile === 'app.js' ? 'bg-[#313B6B]/40 text-blue-400 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]' : 'text-gray-400 hover:bg-white/5'}`}
             >
                <div className="flex items-center gap-2">
                   <FileCode2 className={`w-3.5 h-3.5 ${activeFile === 'app.js' ? 'text-yellow-400' : 'text-yellow-600'}`} />
                   <span className={activeFile === 'app.js' ? 'font-medium' : ''}>app.js</span>
                </div>
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
             </div>
             
             <div 
               onClick={() => setActiveFile('db.config.js')}
               className={`flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer transition-all ${activeFile === 'db.config.js' ? 'bg-[#313B6B]/40 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:bg-white/5'}`}
             >
                <div className="flex items-center gap-2">
                   <FileCode2 className={`w-3.5 h-3.5 ${activeFile === 'db.config.js' ? 'text-blue-400' : 'text-gray-500'}`} />
                   <span>db.config.js</span>
                </div>
             </div>
          </div>
        </div>

        {/* Repository Links */}
        <div className="p-4 border-t border-white/5 bg-black/20 rounded-b-xl">
           <div className="space-y-1">
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                 <FaGithub className="w-4 h-4" />
                 GitHub Repository
              </a>
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                 <GitPullRequest className="w-4 h-4" />
                 Pull Requests <span className="ml-auto bg-blue-500/20 text-blue-400 py-0.5 px-2 rounded-full text-[10px]">3</span>
              </a>
           </div>
        </div>
      </motion.div>

      {/* Code Editor Area */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 bg-[#1E2330]/80 backdrop-blur-xl border border-white/5 rounded-xl flex flex-col overflow-hidden shadow-lg"
      >
        {/* Editor Tabs */}
        <div className="flex bg-black/40 border-b border-white/5">
          <div className="px-5 py-3 bg-[#141824] border-r border-white/5 border-t-2 border-t-blue-500 text-xs font-mono text-blue-400 flex items-center gap-2 shadow-lg">
            <FileCode2 className="w-3.5 h-3.5 text-yellow-400" />
            {activeFile}
          </div>
          <div className="px-5 py-3 border-r border-white/5 text-xs font-mono text-gray-500 flex items-center gap-2 cursor-pointer hover:bg-white/5 transition-colors">
            <FileCode2 className="w-3.5 h-3.5 text-gray-600" />
            auth.routes.js
          </div>
        </div>

        {/* Editor Toolbar */}
        <div className="flex items-center justify-between px-5 py-2 border-b border-white/5 bg-white/[0.02]">
          <div className="text-[10px] text-gray-500 font-mono flex items-center gap-2">
            <span>src</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-300">{activeFile}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors">
              <Play className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-auto bg-[#141824] p-4 font-mono text-[13px] leading-loose relative">
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-black/20 border-r border-white/5 flex flex-col items-end py-4 pr-3 text-gray-600 select-none text-[11px] font-medium tracking-wide opacity-50">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <div className="pl-14 pt-1">
            <pre className="text-gray-300 whitespace-pre-wrap break-words">
              <code dangerouslySetInnerHTML={{ __html: syntaxHighlight(fileContent) }} />
            </pre>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Very basic syntax highlighting mock
function syntaxHighlight(code: string) {
  return code
    .replace(/import|from|const|let|var|function|return|if|else|try|catch/g, '<span className="text-purple-400">$&</span>')
    .replace(/'.*?'|".*?"/g, '<span className="text-green-400">$&</span>')
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '<span className="text-gray-500">$&</span>')
    .replace(/(\w+)(?=\()/g, '<span className="text-blue-400">$&</span>');
}
