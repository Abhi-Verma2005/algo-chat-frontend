import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  username?: string;
  leetcodeUsername?: string;
  codeforcesUsername?: string;
  section?: string;
  enrollmentNum?: string;
  profileUrl?: string;
  groupId?: string;
  individualPoints?: number;
}

interface Session {
  user: User;
  expires: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  handleLoginSuccess: (userData: User, token: string) => Promise<void>;
  makeAuthenticatedRequest: (endpoint: string, options?: RequestInit) => Promise<Response>;
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Check stored session first
      const stored = await chrome.storage.local.get(['token', 'user', 'timestamp']);
      
      if (stored.token && stored.user && stored.timestamp) {
        // Check if session is not too old (7 days)
        const isRecent = Date.now() - stored.timestamp < 7 * 24 * 60 * 60 * 1000;
        
        if (isRecent) {
          // Verify token with backend
          const isValid = await verifyTokenWithBackend(stored.token);
          if (isValid) {
            setUser(stored.user);
            setIsAuthenticated(true);
            setLoading(false);
            return;
          }
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('[AuthProvider] Auth initialization failed:', error);
      setLoading(false);
    }
  };

  const verifyTokenWithBackend = async (token: string): Promise<boolean> => {
    try {
      const API_BASE_URL = (import.meta as any).env?.VITE_BACKEND_API_BASE_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('[AuthProvider] Token verification failed:', error);
      return false;
    }
  };

  const login = async (): Promise<void> => {
    try {
      // Ask the Chat component to open its login popup
      window.dispatchEvent(new CustomEvent('openLoginPopup'))
    } catch (e) {
      console.error('[AuthProvider] login: failed to dispatch login popup event', e)
    }
  };

  const handleLoginSuccess = async (userData: User, token: string) => {
    setUser(userData);
    setIsAuthenticated(true);
    // Store token for future requests
    try {
      await chrome.storage.local.set({ token, user: userData, timestamp: Date.now() })
    } catch {}
    
    // Create session object
    const newSession: Session = {
      user: userData,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    setSession(newSession);
  };

  const logout = async (): Promise<void> => {
    try {
      // Clear stored data
      await chrome.storage.local.remove(['token', 'user', 'timestamp']);
      
      // Clear local state
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      // Inform background to clear its in-memory token as well
      try {
        await new Promise<void>((resolve) => {
          (chrome.runtime.sendMessage as any)({ action: 'logout' }, () => resolve())
        })
      } catch {}
    } catch (error) {
      console.error('[AuthProvider] logout: Error during logout:', error);
    }
  };

  const makeAuthenticatedRequest = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
    const stored = await chrome.storage.local.get(['token']);
    
    if (!stored.token) {
      throw new Error('No authentication token available');
    }

    const API_BASE_URL = (import.meta as any).env?.VITE_BACKEND_API_BASE_URL || 'http://localhost:3001/api';
    
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${stored.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    return response;
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    session,
    loading,
    login,
    logout,
    handleLoginSuccess,
    makeAuthenticatedRequest,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};