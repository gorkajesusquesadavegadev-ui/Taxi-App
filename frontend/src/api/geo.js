const NOMINATIM = "https://nominatim.openstreetmap.org";
// Viewbox completo del archipiélago canario (lon_min, lat_max, lon_max, lat_min)
const VIEWBOX = "-18.2,29.4,-13.3,27.5";

/** Autocomplete: query -> [{lat, lng, label}] con números de portal. */
export async function buscarDirecciones(q) {
  try {
    const url =
      `${NOMINATIM}/search?format=jsonv2&q=${encodeURIComponent(q)}` +
      `&limit=10&viewbox=${VIEWBOX}&accept-language=es&addressdetails=1&countrycodes=es`;
    const r = await fetch(url, { headers: { "User-Agent": "CanaryCab/1.0" } });
    if (!r.ok) return [];
    const d = await r.json();
    const seen = new Set();
    const out = [];
    for (const x of d || []) {
      const a = x.address || {};
      // Calle + número de portal
      const via = a.road || a.pedestrian || a.square || a.aeroway || a.amenity || "";
      const num = a.house_number || "";
      const calle = [via, num].filter(Boolean).join(" ").trim() || x.name || "";
      // Barrio / municipio
      const barrio = a.suburb || a.neighbourhood || a.city_district || "";
      const municipio = a.city || a.town || a.village || a.municipality || "";
      const partes = [calle, barrio, municipio].filter(Boolean);
      const label = partes.slice(0, 3).join(", ").trim();
      if (!label || seen.has(label.toLowerCase())) continue;
      seen.add(label.toLowerCase());
      out.push({ lat: Number(x.lat), lng: Number(x.lon), label });
      if (out.length === 8) break;
    }
    return out;
  } catch {
    return [];
  }
}

/** Reverse geocode: coords -> dirección humana (nunca lanza). */
export async function direccionDe(lat, lng) {
  try {
    const r = await fetch(
      `${NOMINATIM}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=es&zoom=17&addressdetails=1`,
      { headers: { "User-Agent": "CanaryCab/1.0" } }
    );
    if (!r.ok) return null;
    const d = await r.json();
    const a = d.address || {};
    const via = a.road || a.pedestrian || a.square || a.aeroway || a.amenity || d.name || "";
    const num = a.house_number || "";
    const calle = [via, num].filter(Boolean).join(" ").trim();
    const zona = a.suburb || a.neighbourhood || a.city || a.town || a.village || "";
    return [calle, zona].filter(Boolean).join(", ") || null;
  } catch {
    return null;
  }
}
