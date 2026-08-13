import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import LandingPage from './pages/LandingPage';
import LoadingPage from './pages/LoadingPage';
import DashboardPage from './pages/DashboardPage';
import CodeAnalysisPage from './pages/CodeAnalysisPage';
import AIChatPage from './pages/AIChatPage';
import ArchitecturePage from './pages/ArchitecturePage';
import RepositoryStructurePage from './pages/RepositoryStructurePage';
import AIInsightsPage from './pages/AIInsightsPage';
import DependencyGraphPage from './pages/DependencyGraphPage';
import { AnalysisProvider } from './context/AnalysisContext';

function App() {
  return (
    <AnalysisProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/loading" element={<LoadingPage />} />
          
          {/* Protected/App Routes with MainLayout */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/repository" element={<RepositoryStructurePage />} />
            <Route path="/code" element={<CodeAnalysisPage />} />
            <Route path="/insights" element={<AIInsightsPage />} />
            <Route path="/graph" element={<DependencyGraphPage />} />
            <Route path="/chat" element={<AIChatPage />} />
            <Route path="/architecture" element={<ArchitecturePage />} />
          </Route>
        </Routes>
      </Router>
    </AnalysisProvider>
  );
}

export default App;
