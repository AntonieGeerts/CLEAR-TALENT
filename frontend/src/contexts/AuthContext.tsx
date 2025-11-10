import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Tenant, AuthResponse } from '../types';
import { apiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const buildTenant = useCallback((tenantData: Tenant | undefined, userTenantId: string | null): Tenant => {
    if (tenantData) {
      return tenantData;
    }
    const now = new Date().toISOString();
    return {
      id: userTenantId ?? 'tenant-fallback',
      name: 'Organization',
      slug: 'org',
      settings: {},
      createdAt: now,
      updatedAt: now,
    };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    setUser(null);
    setTenant(null);
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    const profile = await apiService.getCurrentUser();
    localStorage.setItem('user', JSON.stringify(profile));
    setUser(profile);
    return profile;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');
    const storedTenant = localStorage.getItem('tenant');

    let parsedUser: User | null = null;
    if (storedUser) {
      try {
        parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse stored user', error);
      }
    }

    if (storedTenant) {
      try {
        const parsedTenant: Tenant = buildTenant(JSON.parse(storedTenant), parsedUser?.tenantId ?? null);
        setTenant(parsedTenant);
      } catch (error) {
        console.error('Failed to parse stored tenant', error);
      }
    }

    if (!token) {
      setIsLoading(false);
      return;
    }

    const hydrateProfile = async () => {
      try {
        await refreshCurrentUser();
      } catch (error) {
        console.error('Failed to refresh user profile', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    hydrateProfile();
  }, [logout, refreshCurrentUser]);

  const login = async (email: string, password: string) => {
    try {
      const response: AuthResponse = await apiService.login(email, password);

      localStorage.setItem('auth_token', response.token);
      if (response.refreshToken) {
        localStorage.setItem('refresh_token', response.refreshToken);
      }
      const tenantData = buildTenant(response.tenant, response.user.tenantId);
      localStorage.setItem('tenant', JSON.stringify(tenantData));

      const profile = await refreshCurrentUser();
      setUser(profile);
      setTenant(tenantData);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response: AuthResponse = await apiService.register({ email, password, name, role: 'user' });

      if (!response.token) {
        throw new Error('Registration failed. Please contact an administrator.');
      }

      localStorage.setItem('auth_token', response.token);
      if (response.refreshToken) {
        localStorage.setItem('refresh_token', response.refreshToken);
      }

      const tenantData = buildTenant(response.tenant, response.user.tenantId);
      localStorage.setItem('tenant', JSON.stringify(tenantData));

      const profile = await refreshCurrentUser();
      setUser(profile);
      setTenant(tenantData);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
