import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('auto_captions_token') || null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState('login'); // 'login' | 'register' | 'forgot'

  // Load current user profile on startup if token exists
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axiosClient.get('/auth/me');
        if (res.user) {
          setUser(res.user);
        } else if (res.data?.user) {
          setUser(res.data.user);
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
        // Clear invalid token
        localStorage.removeItem('auto_captions_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  const openAuthModal = (view = 'login') => {
    setAuthModalView(view);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const handleAuthSuccess = (userData, userToken, message) => {
    const validUser = userData || { name: 'User' };
    setUser(validUser);
    if (userToken) {
      setToken(userToken);
      localStorage.setItem('auto_captions_token', userToken);
    }
    closeAuthModal();
    toast.success(message || `Welcome back, ${validUser.name || 'User'}!`);
  };

  const login = async (email, password) => {
    try {
      const res = await axiosClient.post('/auth/login', { email, password });
      const userData = res?.user || res?.data?.user || res;
      const userToken = res?.token || res?.data?.token;
      handleAuthSuccess(userData, userToken, 'Successfully logged in!');
      return true;
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check your credentials.');
      throw err;
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await axiosClient.post('/auth/register', { name, email, password });
      const userData = res?.user || res?.data?.user || res;
      const userToken = res?.token || res?.data?.token;
      handleAuthSuccess(userData, userToken, 'Account created successfully!');
      return true;
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please try again.');
      throw err;
    }
  };

  const googleAuth = async ({ googleId, email, name, avatarUrl }) => {
    try {
      const res = await axiosClient.post('/auth/google', { googleId, email, name, avatarUrl });
      const userData = res?.user || res?.data?.user || res || { name, email };
      const userToken = res?.token || res?.data?.token;
      handleAuthSuccess(userData, userToken, `Signed in as ${userData?.name || userData?.email || name || email || 'User'}`);
      return true;
    } catch (err) {
      toast.error(err.message || 'Google authentication failed.');
      throw err;
    }
  };


  const forgotPassword = async (email) => {
    try {
      const res = await axiosClient.post('/auth/forgot-password', { email });
      toast.success(res.message || 'Password reset instructions have been sent.');
      return res;
    } catch (err) {
      toast.error(err.message || 'Failed to send password reset request.');
      throw err;
    }
  };

  const resetPassword = async (tokenString, newPassword) => {
    try {
      const res = await axiosClient.post('/auth/reset-password', { token: tokenString, newPassword });
      toast.success(res.message || 'Password reset successful!');
      setAuthModalView('login');
      return res;
    } catch (err) {
      toast.error(err.message || 'Failed to reset password.');
      throw err;
    }
  };

  const updateProfile = async (name) => {
    try {
      const res = await axiosClient.put('/auth/me', { name });
      if (res.user) {
        setUser(res.user);
      }
      toast.success(res.message || 'Profile name updated!');
      return res.user;
    } catch (err) {
      toast.error(err.message || 'Failed to update profile name.');
      throw err;
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await axiosClient.get('/auth/me');
      if (res.user) setUser(res.user);
      else if (res.data?.user) setUser(res.data.user);
    } catch (_err) {
      console.warn('Failed to refresh user profile');
    }
  };

  const logout = () => {
    localStorage.removeItem('auto_captions_token');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully.');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        token,
        loading,
        authModalOpen,
        authModalView,
        setAuthModalView,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        googleAuth,
        forgotPassword,
        resetPassword,
        updateProfile,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
