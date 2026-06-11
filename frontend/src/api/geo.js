// Geocoding del navegador vía Nominatim (OpenStreetMap), único proveedor:
// Photon lleva caído un tiempo y cada intento pinta un ERR_CONNECTION_REFUSED
// imborrable en consola. El backend mantiene Photon+Nominatim en servidor.
// Resultados acotados a Gran Canaria para que "Triana" sea la de Las Palmas.
const NOMINATIM = "https://nominatim.openstreetmap.org";
const VIEWBOX = "-15.9,28.2,-15.3,27.7"; // lon1,lat1,lon2,lat2 — Gran Canaria

/** Autocomplete: query -> [{lat, lng, label}] (deduped, max 6). */
export async function buscarDirecciones(q) {
  try {
    const url =
      `${NOMINATIM}/search?format=jsonv2&q=${encodeURIComponent(q)}` +
      `&limit=8&viewbox=${VIEWBOX}&bounded=1&accept-language=es`;
    const r = await fetch(url);
    if (!r.ok) return [];
    const d = await r.json();
    const seen = new Set();
    const out = [];
    for (const x of d || []) {
      const label = x.name
        ? `${x.name}${x.display_name?.includes(",") ? ", " + x.display_name.split(",")[1].trim() : ""}`
        : (x.display_name || "").split(",").slice(0, 2).join(",").trim();
      if (!label || seen.has(label)) continue;
      seen.add(label);
      out.push({ lat: Number(x.lat), lng: Number(x.lon), label });
      if (out.length === 6) break;
    }
    return out;
  } catch {
    return [];
  }
}

/** Reverse geocode: coords -> dirección humana (o null, nunca lanza). */
export async function direccionDe(lat, lng) {
  try {
    const r = await fetch(
      `${NOMINATIM}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=es&zoom=17`
    );
    if (!r.ok) return null;
    const d = await r.json();
    const a = d.address || {};
    const calle = [a.road || a.pedestrian || a.square || d.name, a.house_number]
      .filter(Boolean)
      .join(" ");
    const zona = a.suburb || a.neighbourhood || a.city || a.town || a.village;
    return [calle, zona].filter(Boolean).join(", ") || null;
  } catch {
    return null;
  }
}
