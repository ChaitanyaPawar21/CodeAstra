import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function FullScreenSpinner() {
  return (
    <div className="min-h-screen bg-[#FBF3C4] flex items-center justify-center" role="status" aria-label="Loading">
      <Loader2 className="w-8 h-8 animate-spin text-black" />
    </div>
  );
}

/** Wrap routes that need a signed-in user. Unauthenticated → /login (remembering where they were going). */
export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

/** Wrap /login and /register: signed-in users are sent on to where they were headed (default /dashboard). */
export function PublicOnlyRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenSpinner />;
  if (isAuthenticated) {
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
    return <Navigate to={from || '/dashboard'} replace />;
  }
  return <Outlet />;
}

export default ProtectedRoute;
