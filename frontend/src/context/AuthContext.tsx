import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, UserProfile } from '../services/api';
import { UserRole } from '../types';

interface AuthContextValue {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (payload: { email: string; password: string; fullName: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setRole: (role: UserRole) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('patient');
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const me = await authService.me();
      if (me) {
        setUser(me);
        setRole(me.role as UserRole);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authService.login(email, password);
    if (result.success && result.user) {
      setUser(result.user);
      setRole(result.user.role as UserRole);
    }
    return { success: result.success, error: result.error };
  }, []);

  const register = useCallback(async (payload: { email: string; password: string; fullName: string; phone?: string }) => {
    const result = await authService.register(payload);
    if (result.success && result.user) {
      setUser(result.user);
      setRole(result.user.role as UserRole);
    }
    return { success: result.success, error: result.error };
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setRole('patient');
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, isAuthenticated: !!user, isLoading, login, register, logout, setRole, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
