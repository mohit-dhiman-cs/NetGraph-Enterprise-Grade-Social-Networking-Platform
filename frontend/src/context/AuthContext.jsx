import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { userApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await userApi.getMe();
      setUser(res.data);
    } catch (err) {
      setUser(null);
      localStorage.removeItem('ng_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('ng_token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
      setUser(null);
    }
  }, []);

  const loginWithToken = useCallback(async (token) => {
    localStorage.setItem('ng_token', token);
    setLoading(true);
    await fetchUser();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ng_token');
    setUser(null);
  }, []);

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-background text-primary"><span className="material-symbols-outlined animate-spin text-5xl">sync</span></div>;
  }

  return (
    <AuthContext.Provider value={{ user, loginWithToken, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
