// Geocodificación — espejo de frontend/src/api/geo.js (GPS: expo-location).
import * as Location from "expo-location";

const CARTOCIUDAD = "https://www.cartociudad.es/geocoder/api/geocoder";
const NOMINATIM = "https://nominatim.openstreetmap.org";
const VIEWBOX = "-18.2,29.4,-13.3,27.5";
const CANARY_PROV = new Set(["35", "38"]);
const UA = { "User-Agent": "CanaryCab/1.0 gorquesadave@gmail.com" };

function parseJsonp(text) {
  return JSON.parse(text.trim().replace(/^[^(]+\(|\)$/g, ""));
}

function title(str) {
  return (str || "").toLowerCase().replace(/(^|[,\s(])([a-záéíóúüñàèìòùâêîôûäëïöüçñ])/gi,
    (_, sep, c) => sep + c.toUpperCase());
}

export async function pedirPermisoUbicacion() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
}

export async function ubicacionPrecisa({ maxWaitMs = 7000, buenaPrecision = 25 } = {}) {
  const ok = await pedirPermisoUbicacion();
  if (!ok) return null;
  return new Promise(async (resolve) => {
    let mejor = null;
    let sub = null;
    let timer = null;
    const finish = () => {
      if (sub) sub.remove();
      if (timer) clearTimeout(timer);
      resolve(mejor);
    };
    const considerar = (p) => {
      if (!p) return;
      const fix = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy ?? 9999 };
      if (!mejor || fix.accuracy < mejor.accuracy) mejor = fix;
      if (fix.accuracy <= buenaPrecision) finish();
    };
    // Cascada (igual que el taxista): en interior el GPS puro puede no dar fix
    // nunca — sin esto, el cliente se queda sin origen y no ve taxis ni puede pedir.
    Location.getLastKnownPositionAsync().then(considerar).catch(() => {});
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).then(considerar).catch(() => {});
    try {
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 800, distanceInterval: 0 },
        considerar
      );
    } catch {
      /* seguimos con lastKnown/Balanced hasta el timeout */
    }
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
  const r = await fetch(`${CARTOCIUDAD}/candidatesJsonp?q=${encodeURIComponent(q)}&limit=20`, { headers: UA });
  if (!r.ok) return [];
  const data = parseJsonp(await r.text());
  const out = [];
  for (const x of data) {
    if (!CANARY_PROV.has(x.provinceCode)) continue;
    const lat = Number(x.lat);
    const lng = Number(x.lng);
    if (!lat || !lng || Math.abs(lat) < 0.001) continue;
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
    { headers: UA }
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

export async function direccionDe(lat, lng) {
  try {
    const r = await fetch(`${CARTOCIUDAD}/reverseGeocode?lat=${lat}&lon=${lng}`, { headers: UA });
    if (r.ok) {
      const d = await r.json();
      const tipo = (d?.type || "").toLowerCase();
      const esVia = tipo === "portal" || tipo === "callejero" || tipo === "via";
      if (d && d.address && esVia) {
        const via = title(`${d.tip_via || ""} ${d.address}`.trim());
        const num = d.portalNumber && !d.noNumber ? ` ${d.portalNumber}` : "";
        const zona = title(d.poblacion || d.muni || "");
        const calle = (via + num).trim();
        if (calle) return [calle, zona].filter(Boolean).join(", ");
      }
    }
  } catch (_) {}

  try {
    const r = await fetch(
      `${NOMINATIM}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=es&zoom=18&addressdetails=1`,
      { headers: UA }
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
