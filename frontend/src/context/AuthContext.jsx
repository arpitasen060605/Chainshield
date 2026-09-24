import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getMe as apiGetMe,
  updateProfile as apiUpdateProfile,
  getCurrentUser,
} from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getCurrentUser());
  const [loading, setLoading] = useState(true);

  // Restore & verify session on initial load or browser refresh
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('chainshield_token');
      if (token) {
        try {
          const res = await apiGetMe();
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            apiLogout();
            setUser(null);
          }
        } catch (error) {
          console.error('[Auth] Token verification failed:', error.message);
          apiLogout();
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Handle Login
  const login = useCallback(async (credentials) => {
    const data = await apiLogin(credentials);
    if (data && data.user) {
      setUser(data.user);
    }
    return data;
  }, []);

  // Handle Registration
  const register = useCallback(async (userData) => {
    const data = await apiRegister(userData);
    if (data && data.user && !data.pending) {
      setUser(data.user);
    }
    return data;
  }, []);

  // Handle Profile Update
  const updateProfile = useCallback(async (profileData) => {
    const data = await apiUpdateProfile(profileData);
    if (data && data.user) {
      setUser(data.user);
    }
    return data;
  }, []);

  // Handle Logout
  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user && !!localStorage.getItem('chainshield_token'),
      login,
      register,
      updateProfile,
      logout,
      setUser,
    }),
    [user, loading, login, register, updateProfile, logout, setUser]
  );

  return (
    <AuthContext.Provider value={value}>
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

export default AuthContext;

