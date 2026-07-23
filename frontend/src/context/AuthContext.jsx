import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, tokenStore } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, nombre, email, rol, ... }
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
      // Only drop the session when the backend explicitly rejects the token
      // (401/403). A transient failure (backend restarting -> no status) must
      // NOT wipe a still-valid token, or a dev restart silently logs you out.
      if (e?.status === 401 || e?.status === 403) {
        tokenStore.clear();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
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

  const loginGoogle = async (idToken) => {
    const r = await api.loginGoogle(idToken);
    tokenStore.set(r.token);
    await loadMe();
    return r;
  };

  const logout = () => {
    // Revoca el token en el servidor (logout real) antes de limpiarlo local.
    api.logout().catch(() => {});
    tokenStore.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, loginGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
