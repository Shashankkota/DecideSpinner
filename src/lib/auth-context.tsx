"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

// TypeScript interfaces
export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthError {
  message: string;
  code?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  status: AuthStatus;
  error: AuthError | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
}

// Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session token management
const SESSION_TOKEN_KEY = 'auth_session_token';
const SESSION_REFRESH_INTERVAL = 23 * 60 * 60 * 1000; // 23 hours in milliseconds
const SESSION_CHECK_INTERVAL = 60 * 1000; // Check every minute

const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
};

const setStoredToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to store session token:', error);
  }
};

const removeStoredToken = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to remove session token:', error);
  }
};

// API helper function
const makeAuthRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = getStoredToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw {
      message: data.error || 'An error occurred',
      code: data.code || 'UNKNOWN_ERROR',
      status: response.status,
    };
  }

  return data;
};

// Auth Provider Component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    status: 'loading',
    error: null,
  });

  const [refreshTimer, setRefreshTimer] = useState<NodeJS.Timeout | null>(null);
  const [checkTimer, setCheckTimer] = useState<NodeJS.Timeout | null>(null);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  const setError = useCallback((error: AuthError) => {
    setAuthState(prev => ({
      ...prev,
      error,
      status: 'unauthenticated',
      user: null,
    }));
  }, []);

  const setAuthenticated = useCallback((user: User) => {
    setAuthState({
      user,
      status: 'authenticated',
      error: null,
    });
  }, []);

  const setUnauthenticated = useCallback(() => {
    setAuthState({
      user: null,
      status: 'unauthenticated',
      error: null,
    });
  }, []);

  const setLoading = useCallback(() => {
    setAuthState(prev => ({ ...prev, status: 'loading' }));
  }, []);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      setRefreshTimer(null);
    }
    if (checkTimer) {
      clearInterval(checkTimer);
      setCheckTimer(null);
    }
  }, [refreshTimer, checkTimer]);

  // Auto refresh session token
  const scheduleTokenRefresh = useCallback(() => {
    clearTimers();
    
    const timer = setTimeout(async () => {
      try {
        const token = getStoredToken();
        if (!token) return;

        const response = await makeAuthRequest('/api/auth/refresh', {
          method: 'POST',
          body: JSON.stringify({ sessionToken: token }),
        });

        setStoredToken(response.sessionToken);
        setAuthenticated(response.user);
        scheduleTokenRefresh(); // Schedule next refresh
      } catch (error: any) {
        console.error('Token refresh failed:', error);
        await logout();
      }
    }, SESSION_REFRESH_INTERVAL);

    setRefreshTimer(timer);
  }, [clearTimers]);

  // Check session validity periodically
  const scheduleSessionCheck = useCallback(() => {
    const timer = setInterval(async () => {
      const token = getStoredToken();
      if (!token) {
        setUnauthenticated();
        return;
      }

      try {
        await getCurrentUser();
      } catch (error: any) {
        if (error.code === 'INVALID_SESSION' || error.code === 'EXPIRED_SESSION') {
          await logout();
        }
      }
    }, SESSION_CHECK_INTERVAL);

    setCheckTimer(timer);
  }, []);

  // Get current user from session
  const getCurrentUser = useCallback(async (): Promise<void> => {
    try {
      const token = getStoredToken();
      if (!token) {
        setUnauthenticated();
        return;
      }

      const user = await makeAuthRequest('/api/auth/me');
      setAuthenticated(user);
    } catch (error: any) {
      console.error('Get current user failed:', error);
      setError({
        message: error.message || 'Failed to get user information',
        code: error.code,
      });
      removeStoredToken();
    }
  }, [setAuthenticated, setError, setUnauthenticated]);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    try {
      setLoading();
      clearError();

      const response = await makeAuthRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      setStoredToken(response.sessionToken);
      setAuthenticated(response.user);
      scheduleTokenRefresh();
      scheduleSessionCheck();
    } catch (error: any) {
      console.error('Login failed:', error);
      setError({
        message: error.message || 'Login failed',
        code: error.code,
      });
      removeStoredToken();
    }
  }, [setLoading, clearError, setAuthenticated, setError, scheduleTokenRefresh, scheduleSessionCheck]);

  // Register function
  const register = useCallback(async (credentials: RegisterCredentials): Promise<void> => {
    try {
      setLoading();
      clearError();

      await makeAuthRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      // Auto-login after successful registration
      await login({
        email: credentials.email,
        password: credentials.password,
      });
    } catch (error: any) {
      console.error('Registration failed:', error);
      setError({
        message: error.message || 'Registration failed',
        code: error.code,
      });
    }
  }, [setLoading, clearError, setError, login]);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    try {
      const token = getStoredToken();
      
      if (token) {
        // Attempt to logout on server, but don't fail if it doesn't work
        try {
          await makeAuthRequest('/api/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ sessionToken: token }),
          });
        } catch (error) {
          console.warn('Server logout failed, proceeding with client logout:', error);
        }
      }
    } finally {
      // Always clean up local state and storage
      removeStoredToken();
      clearTimers();
      setUnauthenticated();
    }
  }, [clearTimers, setUnauthenticated]);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getStoredToken();
      
      if (!token) {
        setUnauthenticated();
        return;
      }

      try {
        await getCurrentUser();
        scheduleTokenRefresh();
        scheduleSessionCheck();
      } catch (error) {
        console.error('Auth initialization failed:', error);
        removeStoredToken();
        setUnauthenticated();
      }
    };

    initializeAuth();

    // Cleanup timers on unmount
    return () => {
      clearTimers();
    };
  }, [getCurrentUser, scheduleTokenRefresh, scheduleSessionCheck, setUnauthenticated, clearTimers]);

  // Listen for storage changes (logout in other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SESSION_TOKEN_KEY && e.newValue === null) {
        // Token was removed in another tab
        clearTimers();
        setUnauthenticated();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [clearTimers, setUnauthenticated]);

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    getCurrentUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};