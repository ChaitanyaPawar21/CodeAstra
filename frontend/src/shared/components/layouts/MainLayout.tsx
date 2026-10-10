import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAnalysis } from '../../../features/analysis/hooks/useAnalysis';

export default function MainLayout() {
  const { analysisData } = useAnalysis();

  // No real analysis yet → send back to the landing page. Keeps the app from
  // ever rendering with placeholder/sample data.
  if (!analysisData) return <Navigate to="/" replace />;

  return (
    <div className="flex h-screen bg-[#FBF3C4] overflow-hidden text-slate-900 selection:bg-indigo-500/30 selection:text-black">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
