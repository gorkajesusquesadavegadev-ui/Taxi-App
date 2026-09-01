import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { api, tokenStore, alPerderSesion } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, nombre, email, rol, ... }
  const [loading, setLoading] = useState(true);
  // Evita que la comprobación de sesión se dispare en bucle: si /usuarios/me
  // también responde 403, su propio fallo volvería a pedir otra comprobación.
  const comprobando = useRef(false);

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

  /*
   * Sesión caducada estando la app abierta.
   *
   * Antes esto solo se miraba al arrancar. Si el token caducaba (dura 12 h) o
   * se revocaba con la pestaña abierta, los sondeos de ClienteHome seguían
   * pidiendo cada pocos segundos y recibiendo 403 indefinidamente: consola
   * llena de errores rojos, gasto de cupo del limitador y el usuario viendo una
   * pantalla que ya no funcionaba sin que nadie le dijera que volviera a entrar.
   *
   * No basta con cerrar sesión ante cualquier 403: un usuario perfectamente
   * válido recibe 403 al pedir algo que no le corresponde. Por eso se confirma
   * primero contra /usuarios/me, que es la única respuesta que dice de verdad
   * si el token sigue sirviendo.
   */
  useEffect(() => {
    return alPerderSesion(async () => {
      if (comprobando.current || !tokenStore.get()) return;
      comprobando.current = true;
      try {
        await api.me();          // el token sigue bien: era un 403 legítimo
      } catch (e) {
        if (e?.status === 401 || e?.status === 403) {
          tokenStore.clear();
          setUser(null);
        }
      } finally {
        comprobando.current = false;
      }
    });
  }, []);

  const login = useCallback(async (creds) => {
    const r = await api.login(creds);
    tokenStore.set(r.token);
    await loadMe();
    return r;
  }, [loadMe]);

  const register = useCallback(async (data) => {
    const r = await api.register(data);
    tokenStore.set(r.token);
    await loadMe();
    return r;
  }, [loadMe]);

  const loginGoogle = useCallback(async (idToken) => {
    const r = await api.loginGoogle(idToken);
    tokenStore.set(r.token);
    await loadMe();
    return r;
  }, [loadMe]);

  const logout = useCallback(() => {
    // Revoca el token en el servidor (logout real) antes de limpiarlo local.
    api.logout().catch(() => {});
    tokenStore.clear();
    setUser(null);
  }, []);

  // El valor va memoizado: siendo un objeto literal, cada render del provider
  // creaba uno nuevo y volvía a renderizar TODOS los consumidores. Eso hacía
  // además que loginGoogle cambiara de identidad y que el efecto que monta el
  // botón de Google se relanzara, llamando a google.accounts.id.initialize()
  // una y otra vez.
  const valor = useMemo(
    () => ({ user, setUser, loading, login, register, loginGoogle, logout }),
    [user, loading, login, register, loginGoogle, logout]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
