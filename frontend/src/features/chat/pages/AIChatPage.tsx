import { Send, FileCode, Bot, User, Sparkles } from 'lucide-react';

export default function AIChatPage() {
  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto bg-[#12141C] border border-white/[0.07] rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.06] bg-[#090A0F] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-white">Repository Assistant</h2>
            <p className="text-xs text-slate-400 font-mono">Context: current repository</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
          Model Active
        </span>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-white/[0.08] flex items-center justify-center shrink-0 text-slate-300 text-xs">
             <User className="w-4 h-4" />
          </div>
          <div className="flex-1">
             <div className="text-xs font-mono text-slate-400 mb-1">Developer</div>
             <p className="text-slate-200 text-sm bg-[#090A0F] p-3.5 rounded-xl border border-white/[0.05] inline-block leading-relaxed">
               How does the reconciliation process work when a component state updates?
             </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20 border border-indigo-400/30">
             <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1 space-y-3">
             <div className="text-xs font-mono text-indigo-400 mb-1 font-semibold">CodeAstra Assistant</div>
             <p className="text-slate-300 leading-relaxed text-sm bg-[#090A0F] p-4 rounded-xl border border-white/[0.05]">
               In React, the reconciliation process (often referred to as the Virtual DOM diffing algorithm) is primarily handled within the <code className="text-indigo-300 font-mono text-xs">react-reconciler</code> package. When state updates, React creates a new tree of React elements and compares it against the previous tree.
             </p>
             
             <div className="bg-[#090A0F] border border-white/[0.08] rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-indigo-500/30 transition-colors w-fit">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <div className="text-xs">
                  <div className="text-slate-200 font-mono font-medium">ReactFiberWorkLoop.js</div>
                  <div className="text-slate-500 font-mono text-[10px]">packages/react-reconciler/src/</div>
                </div>
             </div>

             <p className="text-slate-300 leading-relaxed text-sm bg-[#090A0F] p-4 rounded-xl border border-white/[0.05]">
               The key entry point for updates is usually <code className="text-indigo-300 font-mono text-xs">scheduleUpdateOnFiber</code>. It marks the fiber node as needing an update and schedules a work loop.
             </p>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/[0.06] bg-[#090A0F]">
        <div className="relative">
          <textarea 
            className="w-full bg-[#12141C] border border-white/[0.08] rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 text-sm text-slate-200 placeholder-slate-500 resize-none h-14"
            placeholder="Ask about architecture, specific files, or how components execute..."
          ></textarea>
          <button className="absolute right-3 top-3 p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-all shadow-sm">
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {['Where are the API routes?', 'Explain auth flow', 'How is the db connected?'].map(q => (
             <button key={q} className="whitespace-nowrap px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-xs font-mono text-slate-400 transition-colors border border-white/[0.06]">
               {q}
             </button>
          ))}
        </div>
      </div>
    </div>
  );
}

