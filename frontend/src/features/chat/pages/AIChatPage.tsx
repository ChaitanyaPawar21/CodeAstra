import { Send, FileCode, Bot, User, Sparkles } from 'lucide-react';

export default function AIChatPage() {
  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto bg-[#FFFBE0] border border-black rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-black bg-[#FBF3C4] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-purple-700 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-[#000000]">Repository Assistant</h2>
            <p className="text-xs text-slate-400 font-mono">Context: current repository</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-xs font-mono">
          Model Active
        </span>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-black flex items-center justify-center shrink-0 text-slate-300 text-xs">
             <User className="w-4 h-4" />
          </div>
          <div className="flex-1">
             <div className="text-xs font-mono text-slate-400 mb-1">Developer</div>
             <p className="text-slate-200 text-sm bg-[#FBF3C4] p-3.5 rounded-xl border border-black inline-block leading-relaxed">
               How does the reconciliation process work when a component state updates?
             </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-[#000000] flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20 border border-indigo-400/30">
             <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1 space-y-3">
             <div className="text-xs font-mono text-purple-700 mb-1 font-semibold">CodeAstra Assistant</div>
             <p className="text-slate-300 leading-relaxed text-sm bg-[#FBF3C4] p-4 rounded-xl border border-black">
               In React, the reconciliation process (often referred to as the Virtual DOM diffing algorithm) is primarily handled within the <code className="text-purple-700 font-mono text-xs">react-reconciler</code> package. When state updates, React creates a new tree of React elements and compares it against the previous tree.
             </p>
             
             <div className="bg-[#FBF3C4] border border-black rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-indigo-500/30 transition-colors w-fit">
                <FileCode className="w-4 h-4 text-purple-700" />
                <div className="text-xs">
                  <div className="text-slate-200 font-mono font-medium">ReactFiberWorkLoop.js</div>
                  <div className="text-slate-500 font-mono text-[10px]">packages/react-reconciler/src/</div>
                </div>
             </div>

             <p className="text-slate-300 leading-relaxed text-sm bg-[#FBF3C4] p-4 rounded-xl border border-black">
               The key entry point for updates is usually <code className="text-purple-700 font-mono text-xs">scheduleUpdateOnFiber</code>. It marks the fiber node as needing an update and schedules a work loop.
             </p>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-black bg-[#FBF3C4]">
        <div className="relative">
          <textarea 
            className="w-full bg-[#FFFBE0] border border-black rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 text-sm text-slate-200 placeholder-slate-500 resize-none h-14"
            placeholder="Ask about architecture, specific files, or how components execute..."
          ></textarea>
          <button className="absolute right-3 top-3 p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-[#000000] transition-all shadow-sm">
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {['Where are the API routes?', 'Explain auth flow', 'How is the db connected?'].map(q => (
             <button key={q} className="whitespace-nowrap px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-xs font-mono text-slate-400 transition-colors border border-black">
               {q}
             </button>
          ))}
        </div>
      </div>
    </div>
  );
}

