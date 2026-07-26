import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#1A1D24] text-white font-sans overflow-x-hidden relative selection:bg-indigo-500/30">
      {/* Background Grid & Glows */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
         {/* Subtle grid lines */}
         <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTYwIDBMMCAwTDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')] opacity-50" style={{ backgroundSize: '60px 60px' }}></div>
         
         {/* Glows */}
         <div className="absolute top-0 left-[-10%] w-[50%] h-[50%] rounded-full bg-[#3B82F6] opacity-[0.07] blur-[120px]"></div>
         <div className="absolute top-[10%] right-[-5%] w-[40%] h-[60%] rounded-full bg-[#EC4899] opacity-[0.05] blur-[120px]"></div>
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 max-w-[1400px] mx-auto relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center text-indigo-400">
             {/* Logo Icon Mock */}
             <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
             </svg>
          </div>
          <div className="flex flex-col leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-wide">Codebase</span>
              <span className="text-[9px] font-bold bg-white/10 px-1.5 py-0.5 rounded text-gray-300">AI</span>
            </div>
            <span className="text-sm text-gray-400">Intelligence Agent</span>
          </div>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-gray-400">
          <a href="#" className="hover:text-white transition-colors">Features</a>
          <a href="#" className="hover:text-white transition-colors">Pricing</a>
          <a href="#" className="hover:text-white transition-colors">Docs</a>
          <a href="#" className="hover:text-white transition-colors">Sign In</a>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 rounded-lg bg-[#313B6B] hover:bg-[#3d4880] text-white text-[15px] font-medium transition-colors border border-[#4B5A9A]"
          >
            Start Analyzing
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-[1200px] mx-auto px-6 pt-20 pb-16 text-center relative z-10">
        {/* Floating background elements (mocking the nodes) */}
        <div className="absolute left-[5%] top-[10%] hidden lg:block opacity-60">
           <div className="flex flex-col gap-12">
              <div className="px-4 py-2 bg-[#222631] border border-white/10 rounded-lg text-xs text-gray-400 flex items-center gap-2">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
                 Repository
                 <span className="absolute -right-2 top-0 w-4 h-4 bg-[#313B6B] rounded-full text-[8px] flex items-center justify-center text-white border border-[#4B5A9A]">AI</span>
              </div>
              <div className="px-4 py-2 bg-[#222631] border border-white/10 rounded-lg text-xs text-gray-400 flex items-center gap-2 relative left-[-40px]">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
                 Repository
                 <span className="absolute -right-2 top-0 w-4 h-4 bg-[#313B6B] rounded-full text-[8px] flex items-center justify-center text-white border border-[#4B5A9A]">AI</span>
              </div>
           </div>
           {/* Connection lines mock */}
           <svg className="absolute top-6 left-full w-32 h-24 overflow-visible" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5">
              <path d="M 0 0 C 40 0, 40 40, 80 40" />
              <path d="M -40 80 C 0 80, 0 40, 80 40" />
           </svg>
        </div>

        <div className="absolute right-[5%] top-[10%] hidden lg:block opacity-60">
           <div className="bg-[#222631] border border-white/10 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-2">Architecture</div>
              <div className="flex gap-2 items-center">
                 <div className="w-12 h-6 border border-[#4B5A9A] rounded"></div>
                 <div className="w-4 h-[1px] bg-white/20"></div>
                 <div className="flex flex-col gap-1">
                    <div className="w-12 h-4 border border-white/20 rounded"></div>
                    <div className="w-12 h-4 border border-white/20 rounded"></div>
                    <div className="w-12 h-4 border border-white/20 rounded"></div>
                 </div>
              </div>
           </div>
        </div>

        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[64px] font-bold tracking-tight leading-[1.1] mb-6 text-gray-100"
        >
          Understand <span className="text-[#E2E8F0]">Any</span><br/>
          <span className="text-[#E2E8F0]">Codebase</span> <span className="text-gray-400">in Minutes</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-gray-400 max-w-xl mx-auto mb-14 leading-relaxed"
        >
          AI-powered repository intelligence for developers<br/>onboarding into unfamiliar projects
        </motion.p>

        {/* URL Input */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-[700px] mx-auto relative group mb-24"
        >
          {/* Outer glow */}
          <div className="absolute -inset-[2px] bg-gradient-to-r from-[#4A6BF3] via-[#7F86D1] to-[#4A6BF3] rounded-full blur-md opacity-40"></div>
          
          <div className="relative flex items-center bg-[#1E2330] rounded-full p-2 border border-white/10">
            <input 
              type="text" 
              placeholder="Paste GitHub Repository URL..." 
              className="flex-1 bg-transparent border-none text-white px-6 py-3 focus:outline-none focus:ring-0 text-[17px] placeholder-[#64748b]"
            />
            <button 
              onClick={() => navigate('/loading')}
              className="px-8 py-3.5 bg-[#313B6B] hover:bg-[#3d4880] text-white rounded-full font-medium transition-colors border border-[#4B5A9A] text-[15px]"
            >
              Analyze Repository
            </button>
          </div>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="flex flex-col lg:flex-row gap-4 max-w-[1300px] mx-auto pb-24">
          
          {/* Card 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex-1 bg-[#1A1D24] rounded-2xl p-6 border border-white/5 flex flex-col hover:border-white/10 transition-colors shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-start gap-3 mb-4">
               <div className="w-8 h-8 rounded-lg bg-[#222631] border border-white/5 flex items-center justify-center text-blue-400 shrink-0">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
               </div>
               <h3 className="text-[15px] font-medium text-white leading-snug pr-4">Visualize and explain project directories</h3>
            </div>
            <p className="text-[13px] text-gray-400 leading-relaxed mb-6">
              Visualize and explain main project directories to show how minimal files, internal structure form.
            </p>
            <div className="mt-auto bg-[#0F1117] rounded-xl border border-white/5 p-4 flex-1 flex flex-col min-h-[140px]">
               <div className="flex items-center gap-1.5 mb-4">
                  <div className="w-2 h-2 rounded-full bg-[#EF4444]"></div>
                  <div className="w-2 h-2 rounded-full bg-[#F59E0B]"></div>
                  <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
               </div>
               <div className="flex text-[10px] text-gray-500 font-mono gap-12">
                  <div className="flex flex-col gap-2">
                     <div className="text-gray-300 flex items-center gap-1.5"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg> src</div>
                     <div className="pl-4 flex items-center gap-1.5"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg> api</div>
                     <div className="pl-4 flex items-center gap-1.5"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg> components</div>
                     <div className="pl-4 flex items-center gap-1.5"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg> hooks</div>
                  </div>
                  <div className="flex flex-col gap-2">
                     <div className="text-gray-300 flex items-center gap-1.5"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg> models</div>
                     <div className="pl-4 flex items-center gap-1.5"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg> user.ts</div>
                     <div className="pl-4 flex items-center gap-1.5"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg> post.ts</div>
                  </div>
               </div>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex-1 bg-[#1A1D24] rounded-2xl p-6 border border-white/5 flex flex-col hover:border-white/10 transition-colors shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-start gap-3 mb-4">
               <div className="w-8 h-8 rounded-lg bg-[#222631] border border-white/5 flex items-center justify-center text-blue-400 shrink-0">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
               </div>
               <h3 className="text-[15px] font-medium text-white leading-snug pr-4">Detect execution starting files and runtime flow</h3>
            </div>
            <p className="text-[13px] text-gray-400 leading-relaxed mb-6">
              Detect execution starting files and runtime flow to start to generate flow diagram visualization.
            </p>
            <div className="mt-auto bg-[#0F1117] rounded-xl border border-white/5 p-4 flex-1 flex flex-col min-h-[140px] items-center justify-center">
                <div className="flex flex-col gap-4 w-full">
                   <div className="flex items-center gap-3">
                      <div className="px-3 py-1.5 rounded-md bg-[#222631] text-[10px] text-gray-300 border border-white/10">▶ Start</div>
                      <div className="flex-1 h-[1px] bg-white/10 relative">
                         <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-white/30 rounded-full"></div>
                      </div>
                      <div className="px-3 py-1.5 rounded-md bg-[#222631] text-[10px] text-gray-300 border border-white/10">Main Flow</div>
                   </div>
                   <div className="flex items-center gap-3 ml-12">
                      <div className="w-px h-6 bg-white/10"></div>
                   </div>
                   <div className="flex items-center gap-3 ml-8">
                      <div className="w-4 h-[1px] bg-white/10"></div>
                      <div className="px-3 py-1.5 rounded-md bg-[#222631] text-[10px] text-gray-300 border border-white/10">Service</div>
                   </div>
                </div>
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex-1 bg-[#1A1D24] rounded-2xl p-6 border border-white/5 flex flex-col hover:border-white/10 transition-colors shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-start gap-3 mb-4">
               <div className="w-8 h-8 rounded-lg bg-[#222631] border border-white/5 flex items-center justify-center text-blue-400 shrink-0">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
               </div>
               <h3 className="text-[15px] font-medium text-white leading-snug">Show relationships between routes, controllers, services</h3>
            </div>
            <p className="text-[13px] text-gray-400 leading-relaxed mb-6">
              Show relationships between routers, controllers, services, and models.
            </p>
            <div className="mt-auto bg-[#0F1117] rounded-xl border border-white/5 p-4 flex-1 flex flex-col min-h-[140px] items-center justify-center">
                <div className="flex items-center w-full gap-4">
                   <div className="px-3 py-1.5 rounded-md bg-[#222631] text-[10px] text-gray-300 border border-white/10 shrink-0">Repository</div>
                   <div className="flex flex-col gap-2 flex-1">
                      <div className="px-3 py-1 rounded bg-[#222631] text-[9px] text-gray-400 border border-white/10 flex items-center justify-between">Controllers <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span></div>
                      <div className="px-3 py-1 rounded bg-[#222631] text-[9px] text-gray-400 border border-white/10 flex items-center justify-between">Services <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span></div>
                      <div className="px-3 py-1 rounded bg-[#222631] text-[9px] text-gray-400 border border-white/10 flex items-center justify-between">Models <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span></div>
                   </div>
                </div>
            </div>
          </motion.div>

          {/* Card 4 - Wide Mockup Window */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex-[2] bg-[#141824] rounded-2xl border border-white/5 flex flex-col overflow-hidden shadow-2xl relative"
          >
             {/* Window Header */}
             <div className="h-8 bg-[#1A1D24] border-b border-white/5 flex items-center px-3 gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></div>
                <div className="flex-1 flex justify-center">
                   <div className="w-48 h-5 bg-[#222631] rounded flex items-center justify-center text-[9px] text-gray-500">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
                      search or paste github url...
                   </div>
                </div>
             </div>
             
             {/* Window Content */}
             <div className="flex flex-1 p-2 gap-2">
                {/* Mock Sidebar */}
                <div className="w-24 border-r border-white/5 pr-2">
                   <div className="text-[8px] font-bold text-gray-500 mb-2">FOLDERS</div>
                   <div className="space-y-1 text-[8px] text-gray-400">
                      <div className="flex items-center gap-1">▶ src</div>
                      <div className="flex items-center gap-1">▶ components</div>
                      <div className="flex items-center gap-1">▶ hooks</div>
                   </div>
                </div>
                
                {/* Mock Main Area (Graph) */}
                <div className="flex-1 bg-[#1A1D24] rounded border border-white/5 p-3 flex flex-col">
                   <div className="text-[10px] font-bold text-gray-300 mb-4">Execution Flow</div>
                   <div className="flex-1 flex items-center justify-center">
                      <div className="flex items-center gap-4">
                         <div className="px-3 py-1.5 rounded bg-[#313B6B] text-[9px] text-white border border-[#4B5A9A]">Execution Flow</div>
                         <div className="w-8 h-[1px] bg-white/20"></div>
                         <div className="flex flex-col gap-2">
                            <div className="px-3 py-1.5 rounded bg-[#222631] text-[9px] text-gray-300 border border-white/10">Models</div>
                            <div className="px-3 py-1.5 rounded bg-[#222631] text-[9px] text-gray-300 border border-white/10">Services</div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Mock Right Panel */}
                <div className="w-32 bg-[#1A1D24] rounded border border-white/5 p-2 space-y-3">
                   <div>
                      <div className="text-[8px] font-bold text-gray-500 mb-1">SUMMARY</div>
                      <div className="h-4 bg-[#222631] rounded text-[7px] text-gray-400 flex items-center px-1">Tech Stack: React, Node</div>
                   </div>
                   <div>
                      <div className="text-[8px] font-bold text-gray-500 mb-1">CRITICAL FILES</div>
                      <div className="space-y-1">
                         <div className="h-3 bg-[#222631] rounded"></div>
                         <div className="h-3 bg-[#222631] rounded"></div>
                      </div>
                   </div>
                </div>
             </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
