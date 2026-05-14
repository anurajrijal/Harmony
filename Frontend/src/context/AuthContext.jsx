import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    setLoading(true);
    try {
      console.log('📡 Fetching user profile...');
      const res = await api.get('/auth/me');
      if (res.data.success && res.data.user) {
        console.log('✅ Auth successful:', res.data.user.username);
        setUser(res.data.user);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('❌ Auth failed:', err.response?.data?.message || err.message);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    fetchUser();
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
