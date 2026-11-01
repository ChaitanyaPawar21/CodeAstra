
import { useState } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { useAnalysis } from '../../analysis/hooks/useAnalysis';
import { sendChat } from '../../../shared/api/chat.api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatPage() {
  const { analysisData, repoUrl } = useAnalysis();

  const repoName =
    analysisData?.summary?.title ||
    repoUrl.replace('https://github.com/', '').replace(/\/$/, '') ||
    'Repository';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Send message to Groq chatbot
  const handleSend = async (textToSend?: string) => {
    const text = (textToSend ?? input).trim();

    if (!text || isLoading) return;

    // Preserve previous conversation history
    const previousHistory = messages.map(({ role, content }) => ({
      role,
      content,
    }));

    // Display user message immediately
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: text },
    ]);

    setInput('');
    setIsLoading(true);

    try {
      const reply = await sendChat({
        message: text,
        history: previousHistory,
        repoUrl,
        repoName,
        analysis: analysisData,
      });

      // Display Groq response
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: reply || 'I could not generate a response.',
        },
      ]);
    } catch (error) {
      console.error('Chat API error:', error);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            error instanceof Error
              ? `Error: ${error.message}`
              : 'Unable to connect to the chatbot. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Send message when Enter is pressed
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto bg-[#FFFBE0] border border-black rounded-2xl overflow-hidden shadow-2xl">

      {/* Header */}
      <div className="p-4 border-b border-black bg-[#FBF3C4] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-purple-700 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>

          <div>
            <h2 className="font-semibold text-sm text-[#000000]">
              Repository Assistant
            </h2>

            <p className="text-xs text-slate-400 font-mono">
              Context: {repoName}
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-slate-900/10 text-slate-700 border border-black/10 text-xs font-mono">
          {isLoading ? 'Thinking...' : 'Ready'}
        </span>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">

        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-black/60 my-auto min-h-[220px]">

            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-purple-700 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6" />
            </div>

            <h3 className="text-sm font-semibold text-black mb-1">
              Repository Assistant for {repoName}
            </h3>

            <p className="text-xs max-w-md leading-relaxed text-slate-500">
              Ask about architecture, specific files, or how components
              connect across the codebase.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className="flex gap-4">

              {/* User / Assistant Icon */}
              <div
                className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 text-xs ${
                  msg.role === 'user'
                    ? 'bg-slate-800 border-black text-slate-300'
                    : 'bg-indigo-600 border-indigo-400/30 text-black shadow-md shadow-indigo-600/20'
                }`}
              >
                {msg.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </div>

              {/* Message Content */}
              <div className="flex-1 space-y-1">

                <div
                  className={`text-xs font-mono mb-1 ${
                    msg.role === 'user'
                      ? 'text-slate-400'
                      : 'text-purple-700 font-semibold'
                  }`}
                >
                  {msg.role === 'user'
                    ? 'Developer'
                    : 'CodeAstra Assistant'}
                </div>

               <div
                    className={`text-sm p-3.5 rounded-xl border border-black leading-relaxed whitespace-pre-wrap break-words ${
                      msg.role === 'user'
                        ? 'bg-[#E0E7FF] text-[#172554]'
                        : 'bg-[#FFFFFF] text-[#111827]'
                    }`}
                  >
                    {msg.role === 'user' ? (
                        msg.content
                      ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      )}
              </div>

              </div>
            </div>
          ))
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-4 items-center">
            <div className="w-8 h-8 rounded-xl border flex items-center justify-center bg-indigo-600 border-indigo-400/30">
              <Sparkles className="w-4 h-4" />
            </div>

            <p className="text-xs text-purple-700 font-mono">
              CodeAstra Assistant is thinking...
            </p>
          </div>
        )}

      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-black bg-[#FBF3C4]">

        <div className="relative">

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="w-full bg-[#FFFBE0] border border-black rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 text-sm text-[#111827] placeholder:text-[#64748B] caret-[#111827] resize-none h-14 disabled:opacity-60"
            placeholder="Ask about architecture, specific files, or how components execute..."
          />

          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="absolute right-3 top-3 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 rounded-lg text-white transition-all shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
          </button>

        </div>

        {/* Suggested Questions */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">

          {[
            'Where are the API routes?',
            'Explain auth flow',
            'How is the db connected?',
          ].map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              disabled={isLoading}
              className="whitespace-nowrap px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-xs font-mono text-slate-400 transition-colors border border-black"
            >
              {q}
            </button>
          ))}

        </div>

      </div>
    </div>
  );
}
