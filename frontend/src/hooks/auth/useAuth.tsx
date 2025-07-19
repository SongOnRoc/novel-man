'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/auth';
import * as authApi from '@/lib/api/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const { data } = await authApi.getMe();
          setUser(data);
        } catch (error) {
          console.error('Failed to fetch user', error);
          localStorage.removeItem('access_token');
        }
      }
      setIsLoading(false);
    };
    checkUser();
  }, []);

  const login = async (credentials: any) => {
    const { data } = await authApi.login(credentials);
    localStorage.setItem('access_token', data.access_token);
    const { data: userData } = await authApi.getMe();
    setUser(userData);
  };

  const register = async (data: any) => {
    await authApi.register(data);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      localStorage.removeItem('access_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};