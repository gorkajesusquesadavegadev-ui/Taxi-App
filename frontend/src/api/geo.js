// Geocoding via Photon (OpenStreetMap). Results biased to Gran Canaria with
// a bbox so "Triana" finds the street in Las Palmas, not in Sevilla.
const PHOTON = "https://photon.komoot.io";
const BBOX = "-15.9,27.7,-15.3,28.2"; // lonMin,latMin,lonMax,latMax — Gran Canaria
const CENTER = { lat: 28.1235, lon: -15.4363 }; // Las Palmas de G.C.

function labelOf(p) {
  const calle = p.name || [p.street, p.housenumber].filter(Boolean).join(" ");
  const zona = p.district || p.city || p.county;
  return [calle, zona && zona !== calle ? zona : null].filter(Boolean).join(", ");
}

/** Autocomplete: query -> [{lat, lng, label}] (deduped, max 6). */
export async function buscarDirecciones(q) {
  const url =
    `${PHOTON}/api/?q=${encodeURIComponent(q)}&limit=8` +
    `&lat=${CENTER.lat}&lon=${CENTER.lon}&bbox=${BBOX}`;
  const r = await fetch(url);
  if (!r.ok) return [];
  const d = await r.json();
  const seen = new Set();
  const out = [];
  for (const f of d.features || []) {
    const label = labelOf(f.properties || {});
    if (!label || seen.has(label)) continue;
    seen.add(label);
    out.push({
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
      label,
    });
    if (out.length === 6) break;
  }
  return out;
}

/** Reverse geocode: coords -> human address (or null). */
export async function direccionDe(lat, lng) {
  try {
    const r = await fetch(`${PHOTON}/reverse?lat=${lat}&lon=${lng}`);
    if (!r.ok) return null;
    const f = (await r.json()).features?.[0];
    return f ? labelOf(f.properties || {}) || null : null;
  } catch {
    return null;
  }
}
