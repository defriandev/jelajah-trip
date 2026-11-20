import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('jelajah_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  // Inisialisasi status autentikasi melalui session cookie httpOnly
  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await authService.getProfile();
        if (res.success && res.data) {
          setUser(res.data);
          localStorage.setItem('jelajah_user', JSON.stringify(res.data));
        }
      } catch (err) {
        // Coba refresh token jika access token telah kedaluwarsa
        try {
          await authService.refreshToken();
          const profileRes = await authService.getProfile();
          if (profileRes.success && profileRes.data) {
            setUser(profileRes.data);
            localStorage.setItem('jelajah_user', JSON.stringify(profileRes.data));
          }
        } catch {
          setUser(null);
          localStorage.removeItem('jelajah_user');
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    if (res.success && res.data) {
      const userData = res.data.user;
      setUser(userData);
      localStorage.setItem('jelajah_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.error || 'Login gagal');
  };

  const register = async (name, email, password) => {
    const res = await authService.register({ name, email, password });
    if (res.success && res.data) {
      const userData = res.data.user;
      setUser(userData);
      localStorage.setItem('jelajah_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.error || 'Pendaftaran gagal');
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout request failed:', err.message);
    } finally {
      setUser(null);
      localStorage.removeItem('jelajah_user');
    }
  };

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        loading,
        login,
        register,
        logout,
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
