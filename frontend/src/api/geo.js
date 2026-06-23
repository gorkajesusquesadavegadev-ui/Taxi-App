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

/** Autocomplete: query → [{lat, lng, label}] con números de portal exactos */
export async function buscarDirecciones(q) {
  // ── 1. Cartociudad (IGN) — todos los portales de España ──────────────────
  try {
    const r = await fetch(
      `${CARTOCIUDAD}/candidatesJsonp?q=${encodeURIComponent(q)}&limit=20`,
      { headers: { "User-Agent": "CanaryCab/1.0 gorquesadave@gmail.com" } }
    );
    if (r.ok) {
      const data = parseJsonp(await r.text());
      const seen = new Set();
      const out = [];
      for (const x of data) {
        if (!CANARY_PROV.has(x.provinceCode)) continue; // solo Canarias
        const lat = Number(x.lat);
        const lng = Number(x.lng);
        if (!lat || !lng || Math.abs(lat) < 0.001) continue; // descarta coords inválidas
        const label = title(x.address || "");
        if (!label || seen.has(label.toLowerCase())) continue;
        seen.add(label.toLowerCase());
        out.push({ lat, lng, label });
        if (out.length === 8) break;
      }
      if (out.length > 0) return out;
    }
  } catch (_) {}

  // ── 2. Nominatim (OSM) — fallback para POIs, aeropuertos, lugares ────────
  try {
    const r = await fetch(
      `${NOMINATIM}/search?format=jsonv2&q=${encodeURIComponent(q)}` +
      `&limit=10&viewbox=${VIEWBOX}&bounded=1&accept-language=es&addressdetails=1&countrycodes=es`,
      { headers: { "User-Agent": "CanaryCab/1.0 gorquesadave@gmail.com" } }
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
