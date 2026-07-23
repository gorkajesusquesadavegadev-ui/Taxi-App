// Cartociudad IGN — geocodificador oficial del gobierno español
// Cubre TODOS los portales de España (calles, números, coordenadas exactas)
const CARTOCIUDAD = "https://www.cartociudad.es/geocoder/api/geocoder";

// Nominatim (OSM) — fallback para nombres de lugares, aeropuertos, POIs
const NOMINATIM = "https://nominatim.openstreetmap.org";
const VIEWBOX = "-18.2,29.4,-13.3,27.5"; // archipiélago canario completo

// Provincias canarias: 35 = Las Palmas, 38 = Santa Cruz de Tenerife
const CANARY_PROV = new Set(["35", "38"]);

function parseJsonp(text) {
  return JSON.parse(text.trim().replace(/^[^(]+\(|\)$/g, ""));
}

// "CALLE JAMAT 71, TAMARACEITE" → "Calle Jamat 71, Tamaraceite"
function title(str) {
  return (str || "").toLowerCase().replace(/(^|[,\s(])([a-záéíóúüñàèìòùâêîôûäëïöüçñ])/gi,
    (_, sep, c) => sep + c.toUpperCase());
}

/**
 * GPS de alta precisión: el primer fix del navegador suele venir desviado
 * 100-500 m. Recoge varios fixes durante ~7 s y devuelve el de menor radio de
 * error (accuracy). Resuelve antes si ya hay un fix muy bueno (<25 m).
 * @returns {Promise<{lat, lng, accuracy} | null>}
 */
export function ubicacionPrecisa({ maxWaitMs = 7000, buenaPrecision = 25 } = {}) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    let mejor = null;
    let watchId = null;
    let timer = null;
    const finish = () => {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      if (timer) clearTimeout(timer);
      resolve(mejor);
    };
    watchId = navigator.geolocation.watchPosition(
      (p) => {
        const fix = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy };
        if (!mejor || fix.accuracy < mejor.accuracy) mejor = fix;
        if (fix.accuracy <= buenaPrecision) finish(); // ya es suficientemente preciso
      },
      () => { if (!mejor) finish(); },
      { enableHighAccuracy: true, maximumAge: 0, timeout: maxWaitMs }
    );
    timer = setTimeout(finish, maxWaitMs);
  });
}

// Cartociudad clasifica cada resultado con un "type". portal/callejero traen
// número de portal real (dirección exacta) — de fiar. Todo lo demás
// (toponimo, poblacion, municipio...) es un punto de área aproximado: para
// "Parque Hospital Insular" devuelve el jardín, no el edificio del hospital;
// para un aeropuerto puede devolver un tramo de carretera cualquiera. Esos
// tipos vagos NO deben ganarle a un POI real de Nominatim (que sí indexa
// hospitales/aeropuertos/estaciones como el edificio/instalación exacta).
const CARTO_TIPO_EXACTO = new Set(["portal", "callejero", "via"]);

async function buscarCartociudad(q) {
  const r = await fetch(
    `${CARTOCIUDAD}/candidatesJsonp?q=${encodeURIComponent(q)}&limit=20`,
    { headers: { "User-Agent": "CanaryCab/1.0 gorquesadave@gmail.com" } }
  );
  if (!r.ok) return [];
  const data = parseJsonp(await r.text());
  const out = [];
  for (const x of data) {
    if (!CANARY_PROV.has(x.provinceCode)) continue; // solo Canarias
    const lat = Number(x.lat);
    const lng = Number(x.lng);
    if (!lat || !lng || Math.abs(lat) < 0.001) continue; // descarta coords inválidas
    const label = title(x.address || "");
    if (!label) continue;
    out.push({ lat, lng, label, exacto: CARTO_TIPO_EXACTO.has(x.type) });
  }
  return out;
}

async function buscarNominatim(q) {
  const r = await fetch(
    `${NOMINATIM}/search?format=jsonv2&q=${encodeURIComponent(q)}` +
    `&limit=10&viewbox=${VIEWBOX}&bounded=1&accept-language=es&addressdetails=1&countrycodes=es`,
    { headers: { "User-Agent": "CanaryCab/1.0 gorquesadave@gmail.com" } }
  );
  if (!r.ok) return [];
  const d = await r.json();
  const out = [];
  for (const x of d || []) {
    const a = x.address || {};
    const num = a.house_number || "";
    // x.name es el nombre del sitio que de verdad casó la búsqueda (el
    // hospital, el aeropuerto...). a.road SIEMPRE existe para un POI (la
    // calle donde está), pero usarlo primero pisa el nombre del sitio: para
    // el aeropuerto, a.road = "Autopista del Sur" ganaría a "Aeropuerto de
    // Gran Canaria" y el resultado perdería el nombre buscado. x.name manda.
    const calle = x.name
      ? [x.name, num].filter(Boolean).join(" ").trim()
      : [a.road || a.pedestrian || a.square || "", num].filter(Boolean).join(" ").trim();
    const barrio = a.suburb || a.neighbourhood || a.city_district || "";
    const municipio = a.city || a.town || a.village || a.municipality || "";
    const label = [calle, barrio, municipio].filter(Boolean).slice(0, 3).join(", ").trim();
    if (!label) continue;
    out.push({ lat: Number(x.lat), lng: Number(x.lon), label });
  }
  return out;
}

/**
 * Autocomplete: query → [{lat, lng, label}].
 * Orden de confianza: 1) direcciones exactas de Cartociudad (portal/calle con
 * número real), 2) POIs de Nominatim (hospitales, aeropuertos, estaciones —
 * indexados como la instalación real, no un área genérica), 3) el resto de
 * Cartociudad (toponimos/lugares aproximados) solo si no hay nada mejor.
 */
export async function buscarDirecciones(q) {
  const [carto, osm] = await Promise.all([
    buscarCartociudad(q).catch(() => []),
    buscarNominatim(q).catch(() => []),
  ]);

  const cartoExacto = carto.filter((x) => x.exacto);
  const cartoVago = carto.filter((x) => !x.exacto);

  const seen = new Set();
  const out = [];
  for (const x of [...cartoExacto, ...osm, ...cartoVago]) {
    const k = x.label.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ lat: x.lat, lng: x.lng, label: x.label });
    if (out.length === 8) break;
  }
  return out;
}

/** Reverse geocode: coords → dirección humana (nunca lanza) */
export async function direccionDe(lat, lng) {
  // ── 1. Cartociudad reverse — solo si devuelve un PORTAL/CALLE real ────────
  // Para coords imprecisas, Cartociudad hace snap al lugar más cercano y puede
  // devolver type "poblacion"/"municipio" (p.ej. "Almatriche Bajo"). Eso NO es
  // la calle del usuario: en ese caso caemos a Nominatim, que sí da la vía.
  try {
    const r = await fetch(
      `${CARTOCIUDAD}/reverseGeocode?lat=${lat}&lon=${lng}`,
      { headers: { "User-Agent": "CanaryCab/1.0 gorquesadave@gmail.com" } }
    );
    if (r.ok) {
      const d = await r.json();
      const tipo = (d?.type || "").toLowerCase();
      const esVia = tipo === "portal" || tipo === "callejero" || tipo === "via";
      if (d && d.address && esVia) {
        // Componer "Calle Jamat 71": tip_via + nombre + número de portal
        const via = title(`${d.tip_via || ""} ${d.address}`.trim());
        const num = d.portalNumber && !d.noNumber ? ` ${d.portalNumber}` : "";
        const zona = title(d.poblacion || d.muni || "");
        const calle = (via + num).trim();
        if (calle) return [calle, zona].filter(Boolean).join(", ");
      }
    }
  } catch (_) {}

  // ── 2. Nominatim fallback (zoom 18 = precisión de calle) ──────────────────
  try {
    const r = await fetch(
      `${NOMINATIM}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=es&zoom=18&addressdetails=1`,
      { headers: { "User-Agent": "CanaryCab/1.0 gorquesadave@gmail.com" } }
    );
    if (!r.ok) return null;
    const d = await r.json();
    const a = d.address || {};
    const via = a.road || a.pedestrian || a.square || a.aeroway || a.amenity || d.name || "";
    const num = a.house_number || "";
    const calle = [via, num].filter(Boolean).join(" ").trim();
    const zona = a.suburb || a.neighbourhood || a.city || a.town || a.village || "";
    return [calle, zona].filter(Boolean).join(", ") || null;
  } catch (_) {
    return null;
  }
}
