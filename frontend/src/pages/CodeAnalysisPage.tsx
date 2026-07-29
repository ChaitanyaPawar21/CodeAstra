import { FileCode2, Play } from 'lucide-react';

export default function CodeAnalysisPage() {
  return (
    <div className="h-full flex gap-4">
      {/* File Explorer Sidebar */}
      <div className="w-64 glass-panel flex flex-col hidden lg:flex">
        <div className="p-4 border-b border-white/5 font-semibold text-sm">
          FOLDERS
        </div>
        <div className="p-2 space-y-1 overflow-y-auto">
          {['controllers', 'services', 'models', 'routes', 'config'].map(folder => (
            <div key={folder} className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded cursor-pointer flex items-center gap-2">
              <span className="text-gray-500">▶</span> {folder}
            </div>
          ))}
          <div className="px-3 py-1.5 text-sm text-primary-400 bg-primary-500/10 rounded cursor-pointer flex items-center gap-2 mt-2">
            <FileCode2 className="w-4 h-4" /> auth.controller.js
          </div>
        </div>
      </div>

      {/* Main Code Editor Area */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div className="glass-panel flex-1 flex flex-col min-h-0">
          <div className="h-10 border-b border-white/5 flex items-center px-4 gap-2 bg-dark-900/50">
            <div className="text-sm text-gray-400">auth.controller.js</div>
          </div>
          
          <div className="flex-1 p-4 font-mono text-sm overflow-auto relative">
            <div className="text-gray-500 select-none absolute left-4 top-4 text-right pr-4 border-r border-white/10">
              {Array.from({length: 20}).map((_, i) => (
                <div key={i}>{i+1}</div>
              ))}
            </div>
            <div className="pl-12 space-y-1">
              <div className="text-purple-400">import <span className="text-white">{'{'} UserService {'}'}</span> from <span className="text-green-400">'./services'</span>;</div>
              <div className="text-purple-400">import <span className="text-white">jwt</span> from <span className="text-green-400">'jsonwebtoken'</span>;</div>
              <br/>
              <div className="text-gray-500 italic">// JWT authentication</div>
              <div className="relative group">
                <div className="absolute -inset-1 bg-primary-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative text-purple-400">export const <span className="text-blue-400">login</span> = <span className="text-blue-400">async</span> (req, res) =&gt; {'{'}</div>
                
                {/* AI Annotation Tooltip Mock */}
                <div className="absolute right-0 top-0 translate-x-full ml-4 w-64 p-3 bg-dark-700 border border-primary-500/30 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                  <div className="text-xs text-primary-400 font-semibold mb-1 flex items-center gap-1">✨ AI Annotation</div>
                  <div className="text-xs text-gray-300">This function handles the core authentication logic and interacts with the database to verify credentials.</div>
                </div>
              </div>
              <div className="pl-4">
                <div><span className="text-purple-400">const</span> {'{'} email, password {'}'} = req.body;</div>
                <div><span className="text-purple-400">const</span> user = <span className="text-blue-400">await</span> UserService.find(email);</div>
              </div>
              <div>{'}'};</div>
            </div>
          </div>
        </div>

        {/* Bottom Terminal / Observability */}
        <div className="h-48 glass-panel flex flex-col shrink-0">
           <div className="flex gap-4 px-4 py-2 border-b border-white/5 text-xs text-gray-400">
             <button className="hover:text-white uppercase tracking-wider">Problems</button>
             <button className="hover:text-white uppercase tracking-wider">Output</button>
             <button className="text-primary-400 uppercase tracking-wider border-b border-primary-400 pb-2 -mb-[9px]">Terminal</button>
           </div>
           <div className="p-4 flex gap-6 overflow-hidden">
             <div className="flex-1 bg-dark-900/50 rounded-lg border border-white/5 p-3">
               <div className="text-xs font-semibold mb-2 text-gray-400">Dependency Chain</div>
               <div className="flex items-center gap-2 text-xs">
                 <span className="px-2 py-1 bg-white/5 rounded">Route</span> →
                 <span className="px-2 py-1 bg-primary-500/20 text-primary-400 border border-primary-500/20 rounded">Controller</span> →
                 <span className="px-2 py-1 bg-white/5 rounded">Service</span>
               </div>
             </div>
             <div className="flex-1 bg-dark-900/50 rounded-lg border border-white/5 p-3">
                <div className="text-xs font-semibold mb-2 text-gray-400">Execution Timeline</div>
                <div className="h-8 bg-white/5 rounded relative overflow-hidden mt-4">
                  <div className="absolute top-1/2 -translate-y-1/2 left-2 w-1/3 h-2 bg-blue-500 rounded-full" />
                  <div className="absolute top-1/2 -translate-y-1/2 left-1/3 ml-4 w-1/4 h-2 bg-purple-500 rounded-full" />
                </div>
             </div>
           </div>
        </div>
      </div>

      {/* Right AI Insights Sidebar */}
      <div className="w-80 glass-panel flex flex-col hidden xl:flex">
        <div className="p-4 border-b border-white/5 font-semibold flex items-center justify-between">
          AI Insights
          <button className="p-1 hover:bg-white/10 rounded"><Play className="w-4 h-4 text-primary-400" /></button>
        </div>
        <div className="p-4 space-y-6 overflow-y-auto">
          <div>
            <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase">File Summary</h4>
            <p className="text-sm text-gray-300 bg-dark-900/50 p-3 rounded-lg border border-white/5">
              This controller handles authentication logic including login, signup, and token generation.
            </p>
          </div>
          
          <div>
            <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Criticality Score</h4>
            <div className="h-2 bg-dark-900 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-yellow-500 to-red-500 w-4/5" />
            </div>
            <div className="text-xs text-right mt-1 text-red-400">High Risk (8.5/10)</div>
          </div>

          <div>
             <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Called Services</h4>
             <ul className="text-sm text-blue-400 space-y-1 bg-dark-900/50 p-3 rounded-lg border border-white/5">
               <li>UserService.find()</li>
               <li>UserService.create()</li>
               <li>Database Integrations</li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
