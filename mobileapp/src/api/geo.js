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
    try {
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 800, distanceInterval: 0 },
        (p) => {
          const fix = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy ?? 999 };
          if (!mejor || fix.accuracy < mejor.accuracy) mejor = fix;
          if (fix.accuracy <= buenaPrecision) finish();
        }
      );
    } catch {
      return finish();
    }
    timer = setTimeout(finish, maxWaitMs);
  });
}

export async function buscarDirecciones(q) {
  try {
    const r = await fetch(`${CARTOCIUDAD}/candidatesJsonp?q=${encodeURIComponent(q)}&limit=20`, { headers: UA });
    if (r.ok) {
      const data = parseJsonp(await r.text());
      const seen = new Set();
      const out = [];
      for (const x of data) {
        if (!CANARY_PROV.has(x.provinceCode)) continue;
        const lat = Number(x.lat);
        const lng = Number(x.lng);
        if (!lat || !lng || Math.abs(lat) < 0.001) continue;
        const label = title(x.address || "");
        if (!label || seen.has(label.toLowerCase())) continue;
        seen.add(label.toLowerCase());
        out.push({ lat, lng, label });
        if (out.length === 8) break;
      }
      if (out.length > 0) return out;
    }
  } catch (_) {}

  try {
    const r = await fetch(
      `${NOMINATIM}/search?format=jsonv2&q=${encodeURIComponent(q)}` +
      `&limit=10&viewbox=${VIEWBOX}&bounded=1&accept-language=es&addressdetails=1&countrycodes=es`,
      { headers: UA }
    );
    if (!r.ok) return [];
    const d = await r.json();
    const seen = new Set();
    const out = [];
    for (const x of d || []) {
      const a = x.address || {};
      const via = a.road || a.pedestrian || a.square || a.aeroway || a.amenity || "";
      const num = a.house_number || "";
      const calle = [via, num].filter(Boolean).join(" ").trim() || x.name || "";
      const barrio = a.suburb || a.neighbourhood || a.city_district || "";
      const municipio = a.city || a.town || a.village || a.municipality || "";
      const label = [calle, barrio, municipio].filter(Boolean).slice(0, 3).join(", ").trim();
      if (!label || seen.has(label.toLowerCase())) continue;
      seen.add(label.toLowerCase());
      out.push({ lat: Number(x.lat), lng: Number(x.lon), label });
      if (out.length === 8) break;
    }
    return out;
  } catch (_) {
    return [];
  }
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
