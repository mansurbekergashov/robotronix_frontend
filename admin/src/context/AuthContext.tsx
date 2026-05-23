import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';

interface User {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  isInitializing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (error) {
      console.error('Failed to fetch user:', error);
      if (localStorage.getItem('token')) {
        logout();
      }
    }
  }, []);

  // Fetch latest user data on mount
  useEffect(() => {
    const initAuth = async () => {
      if (localStorage.getItem('token')) {
        await refreshUser();
      }
      setIsInitializing(false);
    };
    initAuth();
  }, [refreshUser]);

  // Token refresh every 14 minutes (just before 15min expiration)
  useEffect(() => {
    if (!user) return;

    const refreshId = setInterval(async () => {
      try {
        // Refresh token is in httpOnly cookie — no body needed
        const response = await api.post('/auth/refresh', {});
        const { token, user: userData } = response.data || {};

        if (token) localStorage.setItem('token', token);
        if (userData) {
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to refresh token:', error);
        logout();
      }
    }, 14 * 60 * 1000);

    return () => clearInterval(refreshId);
  }, [user]);

  // Auto logout after 5 minutes of inactivity
  useEffect(() => {
    if (!user) return;

    let inactivityTimer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        logout();
      }, 30 * 60 * 1000); // 30 minutes
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => document.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [user]);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user: userData } = response.data;

    if (userData.role !== 'ADMIN') {
      throw new Error('Faqat admin foydalanuvchilar kirishi mumkin');
    }

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await api.put('/profile', data);
      const updatedUser = response.data;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Profilni yangilashda xatolik';
      throw new Error(message);
    }
  };

  const logout = async () => {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfile, isAuthenticated: !!user, refreshUser, isInitializing }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
