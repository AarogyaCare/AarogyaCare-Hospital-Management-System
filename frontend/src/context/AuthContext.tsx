import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../services/api';

export type UserRole = 'PATIENT' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'PHARMACIST' | 'BILLING_STAFF' | 'ADMIN';

export interface DoctorProfile {
  id: string;
  userId: string;
  departmentId?: string;
  qualification?: string;
  experienceYears?: number;
  roomNumber?: string;
  rating?: number;
  specializations?: string[];
}

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  phone?: string;
  patientId?: string;
  uhid?: string;
  doctorProfile?: DoctorProfile;
}

interface AuthContextProps {
  user: AuthUser | null;
  login: (accessToken: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  token: string | null;
  loading: boolean;
}
const TOKEN_KEY = 'aarogya_access_token';
const USER_KEY = 'aarogya_current_user';
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

const toAuthUser = (profile: any): AuthUser => {
  const role = String(profile?.role || '').toUpperCase();
  const roles: UserRole[] = ['PATIENT', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'BILLING_STAFF', 'ADMIN'];
  if (!roles.includes(role as UserRole)) throw new Error('The account has an unsupported role. Contact your administrator.');
  if (profile?.is_active === false) throw new Error('This account is inactive. Contact your administrator.');
  return {
    id: String(profile.id || ''),
    name: String(profile.full_name || profile.name || profile.email || 'Account'),
    email: String(profile.email || ''),
    phone: profile.phone ? String(profile.phone) : undefined,
    patientId: profile.patient_profile?.id ? String(profile.patient_profile.id) : undefined,
    uhid: profile.patient_profile?.uhid ? String(profile.patient_profile.uhid) : undefined,
    role: role as UserRole,
    doctorProfile: profile.doctor_profile ? {
      id: String(profile.doctor_profile.id || ''),
      userId: String(profile.doctor_profile.user_id || ''),
      departmentId: profile.doctor_profile.department_id ? String(profile.doctor_profile.department_id) : undefined,
      qualification: profile.doctor_profile.qualification ? String(profile.doctor_profile.qualification) : undefined,
      experienceYears: profile.doctor_profile.experience_years ? Number(profile.doctor_profile.experience_years) : undefined,
      roomNumber: profile.doctor_profile.room_number ? String(profile.doctor_profile.room_number) : undefined,
      rating: profile.doctor_profile.rating ? Number(profile.doctor_profile.rating) : undefined,
      specializations: Array.isArray(profile.doctor_profile.specializations) ? profile.doctor_profile.specializations : [],
    } : undefined,
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const clearSession = () => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
    };
    const onUnauthorized = (event: Event) => {
      const failedToken = (event as CustomEvent<{ token?: string | null }>).detail?.token;
      if (failedToken && localStorage.getItem(TOKEN_KEY) === failedToken) clearSession();
    };
    window.addEventListener('aarogya:unauthorized', onUnauthorized);

    const restoreSession = async () => {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (!savedToken) {
        localStorage.removeItem(USER_KEY);
        if (mounted) setLoading(false);
        return;
      }
      try {
        const profile = await api.me();
        const restoredUser = toAuthUser(profile);
        if (mounted) {
          setToken(savedToken);
          setUser(restoredUser);
          localStorage.setItem(USER_KEY, JSON.stringify(restoredUser));
        }
      } catch {
        if (localStorage.getItem(TOKEN_KEY) === savedToken) clearSession();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void restoreSession();
    return () => {
      mounted = false;
      window.removeEventListener('aarogya:unauthorized', onUnauthorized);
    };
  }, []);

  const login = async (accessToken: string) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    setToken(accessToken);
    try {
      const authenticatedUser = toAuthUser(await api.me());
      setUser(authenticatedUser);
      localStorage.setItem(USER_KEY, JSON.stringify(authenticatedUser));
      return authenticatedUser;
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
      throw error;
    }
  };

  const logout = async () => {
    const logoutRequest = token ? api.logout().catch(() => undefined) : Promise.resolve();
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    await logoutRequest;
  };

  return <AuthContext.Provider value={{ user, login, logout, token, loading }}>{children}</AuthContext.Provider>;
};
export const useAuth = (): AuthContextProps => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
