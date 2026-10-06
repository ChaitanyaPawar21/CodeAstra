import { FileCode2, Play, Sparkles, FolderTree } from 'lucide-react';

export default function CodeAnalysisPage() {
  return (
    <div className="h-full flex gap-5 text-slate-300">
      {/* File Explorer Sidebar */}
      <div className="w-64 bg-[#FFFBE0] border border-black rounded-2xl flex flex-col hidden lg:flex overflow-hidden shadow-lg">
        <div className="p-4 border-b border-black font-mono text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-purple-700" />
          Explorer
        </div>
        <div className="p-3 space-y-1 overflow-y-auto font-mono text-xs">
          {['controllers', 'services', 'models', 'routes', 'config'].map(folder => (
            <div key={folder} className="px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-black/[0.04] rounded-xl cursor-pointer flex items-center gap-2 transition-colors">
              <span className="text-slate-500 text-[10px]">▶</span> {folder}
            </div>
          ))}
          <div className="px-3 py-2 text-black bg-indigo-500/10 border border-indigo-500/20 rounded-xl cursor-pointer flex items-center gap-2 mt-2 font-medium">
            <FileCode2 className="w-4 h-4 text-purple-700" /> auth.controller.js
          </div>
        </div>
      </div>

      {/* Main Code Editor Area */}
      <div className="flex-1 flex flex-col gap-5 min-w-0">
        <div className="bg-[#FFFBE0] border border-black rounded-2xl flex-1 flex flex-col min-h-0 overflow-hidden shadow-lg">
          <div className="h-10 border-b border-black flex items-center px-4 gap-2 bg-[#FBF3C4]">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
            <div className="text-xs font-mono text-slate-300">auth.controller.js</div>
            <span className="ml-auto text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-black">JavaScript</span>
          </div>
          
          <div className="flex-1 p-5 font-mono text-xs overflow-auto relative bg-[#FBF3C4] leading-relaxed">
            <div className="text-slate-600 select-none absolute left-4 top-5 text-right pr-4 border-r border-black">
              {Array.from({length: 16}).map((_, i) => (
                <div key={i}>{i+1}</div>
              ))}
            </div>
            <div className="pl-12 space-y-1">
              <div><span className="text-purple-700">import</span> {'{'} UserService {'}'} <span className="text-purple-700">from</span> <span className="text-emerald-700">'./services'</span>;</div>
              <div><span className="text-purple-700">import</span> jwt <span className="text-purple-700">from</span> <span className="text-emerald-700">'jsonwebtoken'</span>;</div>
              <br/>
              <div className="text-slate-500 italic">// Handles user login and JWT generation</div>
              <div className="relative group">
                <div className="text-purple-700"><span className="text-purple-700">export const</span> <span className="text-blue-700">login</span> = <span className="text-purple-700">async</span> (req, res) =&gt; {'{'}</div>
                
                {/* AI Annotation Tooltip */}
                <div className="absolute right-4 top-0 w-72 p-3.5 bg-[#FFFBE0] border border-indigo-500/30 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 pointer-events-none -translate-y-2 group-hover:translate-y-0">
                  <div className="text-xs text-purple-700 font-semibold mb-1 flex items-center gap-1.5 font-sans">
                    <Sparkles className="w-3.5 h-3.5" /> AI Code Analysis
                  </div>
                  <div className="text-xs text-slate-300 font-sans leading-normal">
                    This function parses email and password credentials, validates against UserService, and issues a signed JWT token.
                  </div>
                </div>
              </div>
              <div className="pl-4">
                <div><span className="text-purple-700">const</span> {'{'} email, password {'}'} = req.body;</div>
                <div><span className="text-purple-700">const</span> user = <span className="text-purple-700">await</span> UserService.find(email);</div>
                <div><span className="text-purple-700">if</span> (!user) <span className="text-purple-700">return</span> res.status(401).json({'{'} error: <span className="text-emerald-700">'User not found'</span> {'}'});</div>
              </div>
              <div>{'}'};</div>
            </div>
          </div>
        </div>

        {/* Bottom Observability Panel */}
        <div className="h-44 bg-[#FFFBE0] border border-black rounded-2xl flex flex-col shrink-0 overflow-hidden shadow-lg">
           <div className="flex gap-6 px-5 py-2.5 border-b border-black text-xs font-mono text-slate-400 bg-[#FBF3C4]">
             <button className="hover:text-[#000000] uppercase tracking-wider">Problems (0)</button>
             <button className="hover:text-[#000000] uppercase tracking-wider">Output</button>
             <button className="text-purple-700 font-semibold uppercase tracking-wider border-b-2 border-indigo-500 pb-2 -mb-[11px]">Terminal</button>
           </div>
           <div className="p-4 flex gap-4 overflow-hidden">
             <div className="flex-1 bg-[#FBF3C4] rounded-xl border border-black p-3.5">
               <div className="text-[11px] font-mono font-bold text-slate-400 mb-2.5 uppercase tracking-wider">Dependency Chain</div>
               <div className="flex items-center gap-2 text-xs font-mono">
                 <span className="px-2.5 py-1 bg-slate-900 border border-black rounded-md text-slate-300">Route</span> →
                 <span className="px-2.5 py-1 bg-indigo-500/10 text-black border border-indigo-500/20 rounded-md font-semibold">Controller</span> →
                 <span className="px-2.5 py-1 bg-slate-900 border border-black rounded-md text-slate-300">Service</span>
               </div>
             </div>
             <div className="flex-1 bg-[#FBF3C4] rounded-xl border border-black p-3.5">
                <div className="text-[11px] font-mono font-bold text-slate-400 mb-2.5 uppercase tracking-wider">Execution Pipeline</div>
                <div className="h-4 bg-slate-900 rounded-full relative overflow-hidden mt-3 border border-black">
                  <div className="absolute top-0 bottom-0 left-0 w-1/3 bg-indigo-500 rounded-full" />
                  <div className="absolute top-0 bottom-0 left-1/3 ml-2 w-1/4 bg-purple-500 rounded-full" />
                </div>
             </div>
           </div>
        </div>
      </div>

      {/* Right AI Insights Sidebar */}
      <div className="w-80 bg-[#FFFBE0] border border-black rounded-2xl flex flex-col hidden xl:flex overflow-hidden shadow-lg">
        <div className="p-4 border-b border-black font-mono text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between bg-[#FBF3C4]">
          File Insights
          <button className="p-1.5 hover:bg-black/[0.06] text-purple-700 rounded-lg transition-colors"><Play className="w-3.5 h-3.5" /></button>
        </div>
        <div className="p-4 space-y-5 overflow-y-auto">
          <div>
            <h4 className="text-[11px] font-mono font-bold text-slate-400 mb-2 uppercase tracking-wider">File Overview</h4>
            <p className="text-xs text-slate-300 bg-[#FBF3C4] p-3.5 rounded-xl border border-black leading-relaxed">
              Authentication controller managing user session verification, credential validation, and security token issuance.
            </p>
          </div>
          
          <div>
            <h4 className="text-[11px] font-mono font-bold text-slate-400 mb-2 uppercase tracking-wider">Complexity Impact</h4>
            <div className="h-2 bg-[#FBF3C4] rounded-full overflow-hidden border border-black mb-1.5">
              <div className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 w-3/4 rounded-full" />
            </div>
            <div className="text-[11px] font-mono text-right text-red-600">High Risk Component</div>
          </div>

          <div>
             <h4 className="text-[11px] font-mono font-bold text-slate-400 mb-2 uppercase tracking-wider">Connected Services</h4>
             <ul className="text-xs font-mono text-black space-y-1.5 bg-[#FBF3C4] p-3.5 rounded-xl border border-black">
               <li>• UserService.find()</li>
               <li>• UserService.create()</li>
               <li>• MongoDb Auth Schema</li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

