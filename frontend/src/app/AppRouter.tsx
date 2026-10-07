import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from '../shared/components/layouts/MainLayout';
import LandingPage from '../features/analysis/pages/LandingPage';
import LoadingPage from '../features/analysis/pages/LoadingPage';
import DashboardPage from '../features/analysis/pages/DashboardPage';
import CodeAnalysisPage from '../features/code/pages/CodeAnalysisPage';
import AIChatPage from '../features/chat/pages/AIChatPage';
import ArchitecturePage from '../features/analysis/pages/ArchitecturePage';
import RepositoryStructurePage from '../features/analysis/pages/RepositoryStructurePage';
import AIInsightsPage from '../features/analysis/pages/AIInsightsPage';
import DependencyGraphPage from '../features/analysis/pages/DependencyGraphPage';
import Login from '../features/auth/pages/Login';
import Register from '../features/auth/pages/Register';
import ForgotPassword from '../features/auth/pages/ForgotPassword';
import ResetPassword from '../features/auth/pages/ResetPassword';
import { ProtectedRoute, PublicOnlyRoute } from '../features/auth/components/ProtectedRoute';

export const AppRouter = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />

                {/* Reset links must remain usable even if the browser has a session. */}
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Public auth routes (signed-in users are redirected onwards) */}
                <Route element={<PublicOnlyRoute />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                </Route>

                {/* Everything below requires a signed-in user */}
                <Route element={<ProtectedRoute />}>
                    {/* /loading is protected because it calls the (now authenticated) analysis API */}
                    <Route path="/loading" element={<LoadingPage />} />

                    {/* App Routes with MainLayout */}
                    <Route element={<MainLayout />}>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/repository" element={<RepositoryStructurePage />} />
                        <Route path="/code" element={<CodeAnalysisPage />} />
                        <Route path="/insights" element={<AIInsightsPage />} />
                        <Route path="/graph" element={<DependencyGraphPage />} />
                        <Route path="/chat" element={<AIChatPage />} />
                        <Route path="/architecture" element={<ArchitecturePage />} />
                    </Route>
                </Route>
            </Routes>
        </Router>
    )
}


