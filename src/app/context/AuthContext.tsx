"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User } from "../../models/User";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Interface for error responses
interface ErrorResponse {
  message?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          try {
            const response = await fetch('/api/auth/user', {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            
            if (response.ok) {
              const data = await response.json();
              setUser(data.user);
            } else {
              const errorData: ErrorResponse = await response.json();
              console.error('Failed to fetch user data:', errorData.message || 'Unknown error');
              localStorage.removeItem('token');
            }
          } catch (error) {
            const errorMessage = error instanceof Error 
              ? error.message 
              : 'Auth check error';
            
            console.error('Auth check error:', errorMessage);
            localStorage.removeItem('token');
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Auth check error';
        
        console.error('Auth check error:', errorMessage);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();
      localStorage.setItem("token", data.token);
      setUser(data.user);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string'
          ? error
          : "Login failed";
      
      throw new Error(errorMessage);
    }
  };

  const loginWithGoogle = async () => {
    try {
      window.location.href = "/api/auth/google";
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string'
          ? error
          : "Google login failed";
      
      throw new Error(errorMessage);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      const data = await response.json();
      localStorage.setItem("token", data.token);
      setUser(data.user);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string'
          ? error
          : "Registration failed";
      
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, loginWithGoogle, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}