import { Send, FileCode, MessageSquare } from 'lucide-react';

export default function AIChatPage() {
  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto glass-panel overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-dark-800/50 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="font-semibold">Repository Assistant</h2>
          <p className="text-xs text-gray-400">Ask questions about facebook/react</p>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 p-[2px] shrink-0 mt-1">
             <div className="h-full w-full rounded-full bg-dark-800 overflow-hidden">
               <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
             </div>
          </div>
          <div>
             <div className="text-sm font-medium mb-1">You</div>
             <p className="text-gray-300">How does the reconciliation process work when a component state updates?</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 mt-1">
             <span className="text-xs font-bold text-white">AI</span>
          </div>
          <div className="flex-1 space-y-3">
             <div className="text-sm font-medium mb-1 text-primary-400">Agent</div>
             <p className="text-gray-300 leading-relaxed text-sm">
               In React, the reconciliation process (often referred to as the Virtual DOM diffing algorithm) is primarily handled within the `react-reconciler` package. When state updates, React creates a new tree of React elements and compares it against the previous tree.
             </p>
             <div className="bg-dark-900 border border-white/10 rounded-lg p-3 inline-flex items-center gap-2 cursor-pointer hover:border-primary-500/50 transition-colors">
                <FileCode className="w-4 h-4 text-blue-400" />
                <div className="text-sm">
                  <div className="text-gray-300">ReactFiberWorkLoop.js</div>
                  <div className="text-xs text-gray-500">packages/react-reconciler/src/</div>
                </div>
             </div>
             <p className="text-gray-300 leading-relaxed text-sm">
               The key entry point for updates is usually `scheduleUpdateOnFiber`. It marks the fiber node as needing an update and schedules a work loop.
             </p>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/5 bg-dark-900/50">
        <div className="relative">
          <textarea 
            className="w-full bg-dark-800 border border-white/10 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 text-sm resize-none h-14"
            placeholder="Ask about architecture, specific files, or how things work..."
          ></textarea>
          <button className="absolute right-3 top-3 p-1.5 bg-primary-600 hover:bg-primary-500 rounded-lg text-white transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {['Where are the API routes?', 'Explain auth flow', 'How is the db connected?'].map(q => (
             <button key={q} className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs text-gray-400 transition-colors border border-white/5">
               {q}
             </button>
          ))}
        </div>
      </div>
    </div>
  );
}
