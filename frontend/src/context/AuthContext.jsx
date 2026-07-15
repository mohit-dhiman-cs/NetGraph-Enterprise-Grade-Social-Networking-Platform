import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { userApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi.getMe()
      .then(res => setUser(res.data))
      .catch(() => setUser({ username: 'guest', role: 'USER', displayName: 'Guest', userId: 0 }))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async () => { return user; }, [user]);
  const register = useCallback(async () => { return user; }, [user]);
  const logout = useCallback(() => {}, []);
  const loginWithToken = useCallback(() => {}, []);

  if (loading) return null; // Wait for identity to load

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loginWithToken, isAuthenticated: true }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
