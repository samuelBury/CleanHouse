// Context d'authentification admin
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { login as loginApi, logout as logoutApi, getMe } from '../services/api';
import type { Admin } from '../types';

interface AuthContextType {
  admin: Admin | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (token) {
        const adminData = await getMe();
        setAdmin(adminData);
      }
    } catch (error) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const data = await loginApi(email, password);
    localStorage.setItem('adminToken', data.accessToken);
    localStorage.setItem('adminRefreshToken', data.refreshToken);
    setAdmin(data.admin);
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore errors
    } finally {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
      setAdmin(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        isLoading,
        isAuthenticated: !!admin,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
