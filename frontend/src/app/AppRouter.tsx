import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from '../shared/components/layouts/MainLayout';
import LandingPage from '../features/analysis/pages/LandingPage';
import LoadingPage from '../features/analysis/pages/LoadingPage';
import DashboardPage from '../features/analysis/pages/DashboardPage';
import CodeAnalysisPage from '../features/analysis/pages/CodeAnalysisPage';
import AIChatPage from '../features/analysis/pages/AIChatPage';
import ArchitecturePage from '../features/analysis/pages/ArchitecturePage';
import RepositoryStructurePage from '../features/analysis/pages/RepositoryStructurePage';
import AIInsightsPage from '../features/analysis/pages/AIInsightsPage';
import DependencyGraphPage from '../features/analysis/pages/DependencyGraphPage';

export const AppRouter = () => {
    return (
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
    )
}


