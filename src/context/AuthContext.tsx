import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole;
  isLoading: boolean;
  login: (emailOrUser: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    pass: string,
    classGrade: string,
    stream: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  completeOnboarding: (score: number) => Promise<void>;
  switchDemoRole: (targetRole: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'learnmate_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize user from token or auto-authenticate default student for initial viewing
  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            setToken(storedToken);
            setIsLoading(false);
            return;
          }
        } catch {
          // Token invalid or expired
        }
      }

      // Default demo student
      try {
        const demoRes = await fetch('/api/auth/switch-demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetRole: 'student' }),
        });
        if (demoRes.ok) {
          const data = await demoRes.json();
          setUser(data.user);
          setToken(data.token);
          localStorage.setItem(TOKEN_KEY, data.token);
        }
      } catch (err) {
        console.error('Failed to initialize demo auth:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (emailOrUser: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailOrUser, username: emailOrUser, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem(TOKEN_KEY, data.token);
      return { success: true };
    } catch {
      return { success: false, error: 'Network error during login' };
    }
  };

  const register = async (
    name: string,
    email: string,
    pass: string,
    classGrade: string,
    stream: string
  ) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password: pass,
          classGrade,
          stream,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem(TOKEN_KEY, data.token);
      return { success: true };
    } catch {
      return { success: false, error: 'Network error during registration' };
    }
  };

  const completeOnboarding = async (score: number) => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/complete-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ score }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      }
    } catch (err) {
      console.error('Failed to complete onboarding on server:', err);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
  };

  const switchDemoRole = async (targetRole: UserRole) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/switch-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem(TOKEN_KEY, data.token);
      }
    } catch (err) {
      console.error('Error switching demo role:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || 'student',
        isLoading,
        login,
        register,
        logout,
        completeOnboarding,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
