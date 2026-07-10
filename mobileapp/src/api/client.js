// REST client — espejo de frontend/src/api/client.js adaptado a React Native.
import AsyncStorage from "@react-native-async-storage/async-storage";

export const BASE = "https://taya-backend-production-a4c2.up.railway.app/api";
export const WS_BASE = "wss://taya-backend-production-a4c2.up.railway.app/ws";

const TOKEN_KEY = "taya_token";
let _token = null;

export const tokenStore = {
  get: () => _token,
  set: (t) => {
    _token = t;
    AsyncStorage.setItem(TOKEN_KEY, t).catch(() => {});
  },
  clear: () => {
    _token = null;
    AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
  },
  hydrate: async () => {
    try {
      _token = await AsyncStorage.getItem(TOKEN_KEY);
    } catch {
      _token = null;
    }
    return _token;
  },
};

async function req(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  if (_token) headers["Authorization"] = "Bearer " + _token;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = text || `${res.status}`;
    try {
      const b = JSON.parse(text);
      if (b && b.message) msg = b.message;
    } catch (_) {}
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  register: (d) => req("POST", "/auth/register", d),
  login: (d) => req("POST", "/auth/login", d),
  logout: () => req("POST", "/auth/logout"),
  me: () => req("GET", "/usuarios/me"),
  actualizarMe: (d) => req("PUT", "/usuarios/me", d),
  cambiarPassword: (d) => req("PUT", "/usuarios/me/password", d),
  rutaViaje: (id) => req("GET", `/viajes/${id}/ruta`),
  statsCliente: () => req("GET", "/stats/cliente"),
  statsTaxista: () => req("GET", "/stats/taxista"),
  zonasCalientes: () => req("GET", "/stats/zonas"),
  catalogo: () => req("GET", "/catalogo"),
  solicitarOferta: (d) => req("POST", "/viajes/solicitar-oferta", d),
  estimar: (d) => req("POST", "/viajes/estimar", d),
  solicitar: (d) => req("POST", "/viajes/solicitar", d),
  activo: () => req("GET", "/viajes/activo"),
  viaje: (id) => req("GET", `/viajes/${id}`),
  taxistaActivo: () => req("GET", "/viajes/taxista-activo"),
  pendienteCercano: () => req("GET", "/viajes/pendiente-cercano"),
  tarifaActual: () => req("GET", "/tarifa/actual"),
  cancelar: (id) => req("PUT", `/viajes/${id}/cancelar`),
  compartirViaje: (id) => req("PUT", `/viajes/${id}/compartir`),
  historialCliente: () => req("GET", "/viajes/historial"),
  cercanos: (lat, lng, radio) =>
    req("GET", `/taxistas/cercanos?lat=${lat}&lng=${lng}${radio ? `&radio=${radio}` : ""}`),
  taxistasOnline: (lat, lng) => req("GET", `/taxistas/online?lat=${lat}&lng=${lng}`),
  estado: (d) => req("PUT", "/taxista/estado", d),
  aceptar: (id) => req("PUT", `/viajes/${id}/aceptar`),
  llegada: (id) => req("PUT", `/viajes/${id}/llegada`),
  iniciar: (id) => req("PUT", `/viajes/${id}/iniciar`),
  finalizar: (id) => req("PUT", `/viajes/${id}/finalizar`),
  historialTaxista: () => req("GET", "/taxista/historial"),
  valorar: (viajeId, estrellas, comentario) =>
    req("POST", `/valoraciones/${viajeId}`, { estrellas, comentario }),
  valoracionPendiente: (viajeId) => req("GET", `/valoraciones/pendiente/${viajeId}`),
  fidelidad: () => req("GET", "/fidelidad"),
  favoritos: () => req("GET", "/favoritos"),
  favoritoCrear: (d) => req("POST", "/favoritos", d),
  favoritoBorrar: (id) => req("DELETE", `/favoritos/${id}`),
  foroHistorial: () => req("GET", "/foro"),
  foroPublicar: (texto) => req("POST", "/foro", { texto }),
  reservarCrear: (d) => req("POST", "/reservas", d),
  reservasMias: () => req("GET", "/reservas/mias"),
  reservasDisponibles: () => req("GET", "/reservas/disponibles"),
  reservasTaxista: () => req("GET", "/reservas/taxista"),
  reservaAceptar: (id) => req("PUT", `/reservas/${id}/aceptar`),
  reservaCancelar: (id) => req("PUT", `/reservas/${id}/cancelar`),
  adminMetricas: () => req("GET", "/admin/metricas"),
  adminUsuarios: () => req("GET", "/admin/usuarios"),
  adminPendientes: () => req("GET", "/admin/taxistas/pendientes"),
  adminVerificar: (id, valor) => req("PUT", `/admin/taxistas/${id}/verificar?valor=${valor}`),
  adminBloquear: (id, valor) => req("PUT", `/admin/usuarios/${id}/bloquear?valor=${valor}`),
  adminViajes: () => req("GET", "/admin/viajes"),
};
