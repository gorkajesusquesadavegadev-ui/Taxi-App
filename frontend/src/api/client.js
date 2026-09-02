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

/**
 * Mensaje de respaldo por código de estado.
 *
 * El backend manda un texto pensado para el usuario en `detail`. Pero si la
 * respuesta no llega a tocar el backend —un 502 del proxy, un mantenimiento,
 * un HTML de error de la CDN— el cuerpo no es JSON, y antes se pintaba tal
 * cual: el usuario acababa viendo etiquetas HTML dentro del recuadro de error.
 */
function mensajePorEstado(estado) {
  if (estado === 401) return "Correo o contraseña incorrectos.";
  if (estado === 403) return "No tienes permiso para hacer esto.";
  if (estado === 404) return "No hemos encontrado lo que buscas.";
  if (estado === 409) return "Esa operación no se puede completar ahora mismo.";
  if (estado === 429) return "Demasiados intentos seguidos. Espera un momento y prueba otra vez.";
  if (estado >= 500) return "El servicio no responde ahora mismo. Inténtalo en unos segundos.";
  return "No hemos podido completar la operación. Inténtalo de nuevo.";
}

// Un texto sirve para enseñarlo solo si parece una frase, no una traza ni HTML.
const TEXTO_TECNICO = /<[a-z!/]|Exception|Throwable|\bError:|\bat [a-z]+\.[a-z]+\.|stack|\{"|^\s*[{[]/i;

function textoUsable(t) {
  return Boolean(t) && typeof t === "string" && t.trim().length > 0
    && t.length <= 300 && !TEXTO_TECNICO.test(t);
}

/*
 * Aviso de "el servidor ha rechazado el token".
 *
 * client.js no sabe nada de React, así que no puede cerrar sesión por su
 * cuenta: se limita a avisar, y AuthContext decide (confirmando contra
 * /usuarios/me, porque un 403 también puede ser legítimo).
 */
const oyentesSesion = new Set();

export function alPerderSesion(fn) {
  oyentesSesion.add(fn);
  return () => oyentesSesion.delete(fn);
}

function avisarSesion() {
  for (const fn of oyentesSesion) {
    try { fn(); } catch (_) { /* un oyente roto no debe tumbar la petición */ }
  }
}

async function req(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = tokenStore.get();
  if (token) headers["Authorization"] = "Bearer " + token;

  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (_) {
    // fetch solo rechaza si no hubo respuesta: sin cobertura, DNS, CORS…
    // El navegador dice "Failed to fetch", que no le sirve a nadie.
    const err = new Error("Sin conexión. Comprueba tu internet e inténtalo de nuevo.");
    err.status = 0;
    throw err;
  }

  if (!res.ok) {
    // Enviamos token y aun así lo rechaza: puede haber caducado o haber sido
    // revocado. No se decide aquí; se avisa y AuthContext lo confirma.
    if ((res.status === 401 || res.status === 403) && token && path !== "/usuarios/me") {
      avisarSesion();
    }
    const text = await res.text().catch(() => "");
    let msg = null;
    try {
      const cuerpo = JSON.parse(text);
      // 'detail' lo usa ProblemDetail, que es lo que devuelve ErroresApi;
      // 'message' queda por compatibilidad con respuestas antiguas.
      const candidato = cuerpo && (cuerpo.detail || cuerpo.message);
      if (textoUsable(candidato)) msg = candidato;
    } catch (_) {
      // No era JSON. Puede ser el HTML de error de un proxy: no se enseña.
    }
    const err = new Error(msg || mensajePorEstado(res.status));
    err.status = res.status;
    throw err;
  }

  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (_) {
    const err = new Error("La respuesta del servidor no era válida. Inténtalo de nuevo.");
    err.status = res.status;
    throw err;
  }
}

export const api = {
  // auth
  register: (d) => req("POST", "/auth/register", d),
  login: (d) => req("POST", "/auth/login", d),
  loginGoogle: (idToken) => req("POST", "/auth/google", { idToken }),
  logout: () => req("POST", "/auth/logout"),
  me: () => req("GET", "/usuarios/me"),
  aceptarConsentimiento: () => req("POST", "/usuarios/me/consentimiento"),
  actualizarMe: (d) => req("PUT", "/usuarios/me", d),
  cambiarPassword: (d) => req("PUT", "/usuarios/me/password", d),
  exportarMisDatos: () => req("GET", "/usuarios/me/exportar"),
  eliminarCuenta: (d) => req("DELETE", "/usuarios/me", d),
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
  ultimoValorable: () => req("GET", "/viajes/ultimo-valorable"),
  viaje: (id) => req("GET", `/viajes/${id}`),
  taxistaActivo: () => req("GET", "/viajes/taxista-activo"),
  pendienteCercano: () => req("GET", "/viajes/pendiente-cercano"),
  tarifaActual: () => req("GET", "/tarifa/actual"),
  cancelar: (id) => req("PUT", `/viajes/${id}/cancelar`),
  compartirViaje: (id) => req("PUT", `/viajes/${id}/compartir`),
  seguir: (token) => req("GET", `/viajes/seguir/${token}`),
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
  // valoraciones (rating 1-5★ tras viaje completado)
  valorar: (viajeId, estrellas, comentario) => req("POST", `/valoraciones/${viajeId}`, { estrellas, comentario }),
  valoracionPendiente: (viajeId) => req("GET", `/valoraciones/pendiente/${viajeId}`),
  // fidelidad
  fidelidad: () => req("GET", "/fidelidad"),
  // favoritos
  favoritos: () => req("GET", "/favoritos"),
  favoritoCrear: (d) => req("POST", "/favoritos", d),
  favoritoBorrar: (id) => req("DELETE", `/favoritos/${id}`),
  // web push
  vapidPublicKey: () => req("GET", "/push/vapid-public-key"),
  pushSubscribe: (d) => req("POST", "/push/subscribe", d),
  pushUnsubscribe: (d) => req("POST", "/push/unsubscribe", d),
  // admin
  adminMetricas: () => req("GET", "/admin/metricas"),
  adminUsuarios: () => req("GET", "/admin/usuarios"),
  adminPendientes: () => req("GET", "/admin/taxistas/pendientes"),
  adminVerificar: (id, valor) => req("PUT", `/admin/taxistas/${id}/verificar?valor=${valor}`),
  adminBloquear: (id, valor) => req("PUT", `/admin/usuarios/${id}/bloquear?valor=${valor}`),
  adminMunicipio: (id, valor) => req("PUT", `/admin/taxistas/${id}/municipio?valor=${valor}`),
  adminViajes: () => req("GET", "/admin/viajes"),
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
