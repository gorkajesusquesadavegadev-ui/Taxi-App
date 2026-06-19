// REST client for the TAYA backend. Mirrors the Spring controllers.
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const TOKEN_KEY = "taya_token";

// sessionStorage (per-tab) not localStorage (shared): lets you run a cliente
// in one tab and a taxista in another tab of the same window without their
// tokens overwriting each other. Trade-off: closing the tab logs you out.
export const tokenStore = {
  get: () => sessionStorage.getItem(TOKEN_KEY),
  set: (t) => sessionStorage.setItem(TOKEN_KEY, t),
  clear: () => sessionStorage.removeItem(TOKEN_KEY),
};

async function req(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = tokenStore.get();
  if (token) headers["Authorization"] = "Bearer " + token;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = text || `${res.status} ${res.statusText}`;
    try {
      const body = JSON.parse(text);
      if (body && body.message) msg = body.message; // Spring error payload
    } catch (_) {
      /* plain text */
    }
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  // auth
  register: (d) => req("POST", "/auth/register", d),
  login: (d) => req("POST", "/auth/login", d),
  me: () => req("GET", "/usuarios/me"),
  actualizarMe: (d) => req("PUT", "/usuarios/me", d),
  cambiarPassword: (d) => req("PUT", "/usuarios/me/password", d),
  rutaViaje: (id) => req("GET", `/viajes/${id}/ruta`),
  statsCliente: () => req("GET", "/stats/cliente"),
  statsTaxista: () => req("GET", "/stats/taxista"),
  zonasCalientes: () => req("GET", "/stats/zonas"),
  catalogo: () => req("GET", "/catalogo"),
  solicitarOferta: (d) => req("POST", "/viajes/solicitar-oferta", d),
  // viajes (cliente)
  estimar: (d) => req("POST", "/viajes/estimar", d),
  solicitar: (d) => req("POST", "/viajes/solicitar", d),
  activo: () => req("GET", "/viajes/activo"),
  viaje: (id) => req("GET", `/viajes/${id}`),
  taxistaActivo: () => req("GET", "/viajes/taxista-activo"),
  tarifaActual: () => req("GET", "/tarifa/actual"),
  cancelar: (id) => req("PUT", `/viajes/${id}/cancelar`),
  historialCliente: () => req("GET", "/viajes/historial"),
  cercanos: (lat, lng, radio) =>
    req("GET", `/taxistas/cercanos?lat=${lat}&lng=${lng}${radio ? `&radio=${radio}` : ""}`),
  taxistasOnline: (lat, lng) =>
    req("GET", `/taxistas/online?lat=${lat}&lng=${lng}`),
  // viajes (taxista)
  estado: (d) => req("PUT", "/taxista/estado", d),
  aceptar: (id) => req("PUT", `/viajes/${id}/aceptar`),
  llegada: (id) => req("PUT", `/viajes/${id}/llegada`),
  iniciar: (id) => req("PUT", `/viajes/${id}/iniciar`),
  finalizar: (id) => req("PUT", `/viajes/${id}/finalizar`),
  historialTaxista: () => req("GET", "/taxista/historial"),
  // foro de taxistas
  foroHistorial: () => req("GET", "/foro"),
  foroPublicar: (texto) => req("POST", "/foro", { texto }),
  // reservas
  reservarCrear: (d) => req("POST", "/reservas", d),
  reservasMias: () => req("GET", "/reservas/mias"),
  reservasDisponibles: () => req("GET", "/reservas/disponibles"),
  reservasTaxista: () => req("GET", "/reservas/taxista"),
  reservaAceptar: (id) => req("PUT", `/reservas/${id}/aceptar`),
  reservaCancelar: (id) => req("PUT", `/reservas/${id}/cancelar`),
};
