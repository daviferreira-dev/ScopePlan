import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  authApi,
  setTokens,
  clearTokens,
  getAccessToken,
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
  logout: () => void;
  isAnalista: boolean;
  isCliente: boolean;
  isDesenvolvedor: boolean;
  isGestor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      authApi
        .me()
        .then((data) => {
          setUser(data.user);
        })
        .catch(() => {
          clearTokens();
          setUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, senha: string) => {
    const data = await authApi.login(email, senha);
    setTokens(data.access_token, data.refresh_token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (nome: string, email: string, senha: string, perfil: string) => {
    await authApi.register(nome, email, senha, perfil);
    // After register, auto-login
    const loginData = await authApi.login(email, senha);
    setTokens(loginData.access_token, loginData.refresh_token);
    setUser(loginData.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      clearTokens();
      setUser(null);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    isAnalista: user?.perfil === 'analista',
    isCliente: user?.perfil === 'cliente',
    isDesenvolvedor: user?.perfil === 'desenvolvedor',
    isGestor: user?.perfil === 'gestor',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
