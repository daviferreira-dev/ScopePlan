import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  authApi,
  setTokens,
  clearTokens,
  getAccessToken,
  logout as apiLogout,
} from '../services/api';

interface User {
  id: number;
  nome: string;
  email: string;
  perfil: string;
  ativo?: boolean;
  criado_em?: string;
  atualizado_em?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  register: (nome: string, email: string, senha: string, perfil: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Restore session on mount using refresh cookie
  // Access token is in-memory only (lost on page reload), so we try
  // the refresh endpoint first (uses HttpOnly cookie), then /me.
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function restoreSession() {
      try {
        // If we have an in-memory access token, try /me directly
        const token = getAccessToken();
        if (token) {
          const data = await authApi.me({ signal: controller.signal });
          if (!cancelled) {
            setUser(data.user as User);
          }
          return;
        }

        // No in-memory token — but a refresh cookie may exist.
        // Try POST /auth/refresh (cookie is sent automatically).
        const refreshResp = await fetch(
          (import.meta.env.VITE_API_URL || '/api') + '/auth/refresh',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            signal: controller.signal,
          }
        );

        if (refreshResp.ok) {
          const refreshData = await refreshResp.json();
          setTokens(refreshData.access_token);
          // Now fetch user with the new access token
          const data = await authApi.me({ signal: controller.signal });
          if (!cancelled) {
            setUser(data.user as User);
          }
        }
        // If refresh also fails, user is not authenticated — stay logged out
      } catch {
        // Aborted or network error — ignore
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  // Listen for auth expiration events (from apiFetch 401 handling)
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      navigate('/login');
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, [navigate]);

  const loginFn = useCallback(async (email: string, senha: string) => {
    const data = await authApi.login(email, senha);
    setTokens(data.access_token);
    setUser(data.user as User);
  }, []);

  const registerFn = useCallback(async (nome: string, email: string, senha: string, perfil: string) => {
    const data = await authApi.register(nome, email, senha, perfil);
    setTokens(data.access_token);
    setUser(data.user as User);
  }, []);

  const logoutFn = useCallback(async () => {
    try {
      await apiLogout(); // Server clears cookie + blocks tokens
    } catch {
      // Ignore — clear local state anyway
    }
    clearTokens();
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login: loginFn,
    register: registerFn,
    logout: logoutFn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
