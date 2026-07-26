import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function LoadingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate loading for 3 seconds then go to dashboard
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center text-white">
      <div className="w-full max-w-3xl p-8">
        <div className="text-center mb-12">
          <motion.div 
            animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="inline-block px-8 py-4 glass-panel gradient-border rounded-2xl mb-8"
          >
            <h2 className="text-2xl font-bold mb-2">Analyzing Repository...</h2>
            <p className="text-primary-400">Current Step: Building Dependency Graph</p>
          </motion.div>
          
          <div className="flex justify-between relative mt-16">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -translate-y-1/2 -z-10" />
            <div className="absolute top-1/2 left-0 w-1/2 h-1 bg-primary-500 -translate-y-1/2 -z-10 shadow-[0_0_10px_#6366F1]" />
            
            {['Cloning', 'Parsing', 'Dependency Graph', 'Entry Points', 'AI Insights'].map((step, i) => (
              <div key={step} className="flex flex-col items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${i < 3 ? 'bg-primary-500 shadow-[0_0_15px_#6366F1]' : 'bg-dark-600 border border-white/20'}`} />
                <span className={`text-xs ${i < 3 ? 'text-white font-medium' : 'text-gray-500'}`}>{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Terminal logs mock */}
        <div className="glass-panel mt-16 rounded-xl overflow-hidden border border-white/10">
          <div className="bg-dark-800 px-4 py-2 flex items-center gap-2 border-b border-white/5">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <span className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="text-xs text-gray-400 ml-2 font-mono">Terminal</span>
          </div>
          <div className="p-4 font-mono text-xs text-gray-400 h-48 overflow-y-auto space-y-1">
            <p><span className="text-blue-400">[INFO]</span> Cloning repository facebook/react...</p>
            <p><span className="text-green-400">[SUCCESS]</span> Cloned in 1.2s</p>
            <p><span className="text-blue-400">[INFO]</span> Parsing source files...</p>
            <p><span className="text-blue-400">[INFO]</span> Parsing src/controllers/userController.js...</p>
            <p className="text-yellow-400">[WARN] Large file size detected: src/utils/helpers.js</p>
            <p><span className="text-blue-400">[INFO]</span> Resolving imports from package.json...</p>
            <p className="text-white animate-pulse">_</p>
          </div>
        </div>
      </div>
    </div>
  );
}
