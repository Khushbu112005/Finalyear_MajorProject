import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('civicsphere_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('civicsphere_token') || null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Validate and hydrate user on load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('civicsphere_token');
      if (storedToken) {
        try {
          const res = await authService.getCurrentUser();
          if (res && res.user) {
            setUser(res.user);
            localStorage.setItem('civicsphere_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('[AuthContext] Session expired or invalid, logging out.');
          localStorage.removeItem('civicsphere_token');
          localStorage.removeItem('civicsphere_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const res = await authService.login({ email, password });
      if (res && res.token && res.user) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('civicsphere_token', res.token);
        localStorage.setItem('civicsphere_user', JSON.stringify(res.user));
        return { success: true, user: res.user };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please check credentials.';
      setAuthError(message);
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    setAuthError(null);
    try {
      const res = await authService.register(userData);
      if (res && res.token && res.user) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('civicsphere_token', res.token);
        localStorage.setItem('civicsphere_user', JSON.stringify(res.user));
        return { success: true, user: res.user };
      }
      return { success: false, message: 'Registration failed' };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please check details.';
      setAuthError(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('civicsphere_token');
    localStorage.removeItem('civicsphere_user');
    setUser(null);
    setToken(null);
    setAuthError(null);
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await authService.updateProfile(profileData);
      if (res && res.user) {
        setUser(res.user);
        localStorage.setItem('civicsphere_user', JSON.stringify(res.user));
        return { success: true, user: res.user };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update profile.';
      return { success: false, message };
    }
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: !!token && !!user,
    loading,
    authError,
    setAuthError,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
