// Auth — espejo de frontend/src/context/AuthContext.jsx.
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, tokenStore } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    try {
      const me = await api.me();
      setUser(me);
    } catch (e) {
      // Solo tirar sesión si el backend rechaza el token (401/403).
      if (e?.status === 401 || e?.status === 403) {
        tokenStore.clear();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    tokenStore.hydrate().then(loadMe);
  }, [loadMe]);

  const login = async (creds) => {
    const r = await api.login(creds);
    tokenStore.set(r.token);
    await loadMe();
    return r;
  };

  const register = async (data) => {
    const r = await api.register(data);
    tokenStore.set(r.token);
    await loadMe();
    return r;
  };

  const logout = () => {
    api.logout().catch(() => {});
    tokenStore.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
