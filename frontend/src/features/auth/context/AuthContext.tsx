import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { UNAUTHORIZED_EVENT } from '../../../shared/api/config';
import * as authApi from '../services/auth.api';
import type { AuthUser } from '../services/auth.api';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** True until the first "who am I?" check finishes — guards must wait for it. */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      setUser(await authApi.getCurrentUser());
    } catch {
      // Backend unreachable: treat as signed out rather than hanging on a spinner.
      setUser(null);
    }
  }, []);

  // Restore the session on page load (the cookie, if any, is sent automatically).
  useEffect(() => {
    let cancelled = false;
    authApi
      .getCurrentUser()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        // Backend unreachable: treat as signed out rather than hanging on a spinner.
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Any API call that returns 401 mid-session signs the user out locally.
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setUser(await authApi.login({ email, password }));
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setUser(await authApi.register({ name, email, password }));
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      // Even if the request failed, drop local state so the UI is signed out.
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({ user, isAuthenticated: user !== null, loading, login, register, logout, refreshUser }),
    [user, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
