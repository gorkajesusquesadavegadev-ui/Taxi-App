// REST client for the TAYA backend. Mirrors the Spring controllers.
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const TOKEN_KEY = "taya_token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
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
    const msg = text || `${res.status} ${res.statusText}`;
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
  // viajes (cliente)
  estimar: (d) => req("POST", "/viajes/estimar", d),
  solicitar: (d) => req("POST", "/viajes/solicitar", d),
  cancelar: (id) => req("PUT", `/viajes/${id}/cancelar`),
  historialCliente: () => req("GET", "/viajes/historial"),
  cercanos: (lat, lng, radio) =>
    req("GET", `/taxistas/cercanos?lat=${lat}&lng=${lng}${radio ? `&radio=${radio}` : ""}`),
  // viajes (taxista)
  estado: (d) => req("PUT", "/taxista/estado", d),
  aceptar: (id) => req("PUT", `/viajes/${id}/aceptar`),
  llegada: (id) => req("PUT", `/viajes/${id}/llegada`),
  iniciar: (id) => req("PUT", `/viajes/${id}/iniciar`),
  finalizar: (id, distanciaReal) => req("PUT", `/viajes/${id}/finalizar`, { distanciaReal }),
  historialTaxista: () => req("GET", "/taxista/historial"),
};
