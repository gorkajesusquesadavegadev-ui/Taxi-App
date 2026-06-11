// Geocoding con doble proveedor: Photon (rápido) y Nominatim (respaldo con
// CORS garantizado). Resultados sesgados a Gran Canaria con bbox para que
// "Triana" sea la calle de Las Palmas, no la de Sevilla.
const PHOTON = "https://photon.komoot.io";
const NOMINATIM = "https://nominatim.openstreetmap.org";
const BBOX = "-15.9,27.7,-15.3,28.2"; // lonMin,latMin,lonMax,latMax — Gran Canaria
const CENTER = { lat: 28.1235, lon: -15.4363 }; // Las Palmas de G.C.

// circuit breaker: si Photon falla, ir directos a Nominatim 5 min
// (menos errores en consola y respuestas más rápidas mientras está caído)
let photonCaidoHasta = 0;
const photonDisponible = () => Date.now() > photonCaidoHasta;
const marcarPhotonCaido = () => {
  photonCaidoHasta = Date.now() + 5 * 60 * 1000;
};

function labelOf(p) {
  const calle = p.name || [p.street, p.housenumber].filter(Boolean).join(" ");
  const zona = p.district || p.city || p.county;
  return [calle, zona && zona !== calle ? zona : null].filter(Boolean).join(", ");
}

/* ---------------- búsqueda (autocompletar) ---------------- */

async function photonSearch(q) {
  const url =
    `${PHOTON}/api/?q=${encodeURIComponent(q)}&limit=8` +
    `&lat=${CENTER.lat}&lon=${CENTER.lon}&bbox=${BBOX}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("photon down");
  const d = await r.json();
  return (d.features || []).map((f) => ({
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
    label: labelOf(f.properties || {}),
  }));
}

async function nominatimSearch(q) {
  // viewbox usa lon1,lat1,lon2,lat2; bounded=1 restringe a la isla
  const url =
    `${NOMINATIM}/search?format=jsonv2&q=${encodeURIComponent(q)}` +
    `&limit=8&viewbox=-15.9,28.2,-15.3,27.7&bounded=1&accept-language=es`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("nominatim down");
  const d = await r.json();
  return (d || []).map((x) => ({
    lat: Number(x.lat),
    lng: Number(x.lon),
    label: x.name
      ? `${x.name}${x.display_name?.includes(",") ? ", " + x.display_name.split(",")[1].trim() : ""}`
      : (x.display_name || "").split(",").slice(0, 2).join(",").trim(),
  }));
}

/** Autocomplete: query -> [{lat, lng, label}] (deduped, max 6). */
export async function buscarDirecciones(q) {
  let res = [];
  try {
    if (!photonDisponible()) throw new Error("photon en cuarentena");
    res = await photonSearch(q);
  } catch (e) {
    if (e.message !== "photon en cuarentena") marcarPhotonCaido();
    try {
      res = await nominatimSearch(q);
    } catch {
      return [];
    }
  }
  const seen = new Set();
  const out = [];
  for (const it of res) {
    if (!it.label || seen.has(it.label)) continue;
    seen.add(it.label);
    out.push(it);
    if (out.length === 6) break;
  }
  return out;
}

/* ---------------- reverse geocoding ---------------- */

async function photonReverse(lat, lng) {
  const r = await fetch(`${PHOTON}/reverse?lat=${lat}&lon=${lng}`);
  if (!r.ok) throw new Error("photon down");
  const f = (await r.json()).features?.[0];
  return f ? labelOf(f.properties || {}) || null : null;
}

async function nominatimReverse(lat, lng) {
  const r = await fetch(
    `${NOMINATIM}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=es&zoom=17`
  );
  if (!r.ok) throw new Error("nominatim down");
  const d = await r.json();
  const a = d.address || {};
  const calle = [a.road || a.pedestrian || a.square || d.name, a.house_number]
    .filter(Boolean)
    .join(" ");
  const zona = a.suburb || a.neighbourhood || a.city || a.town || a.village;
  return [calle, zona].filter(Boolean).join(", ") || null;
}

/** Reverse geocode: coords -> dirección humana (o null, nunca lanza). */
export async function direccionDe(lat, lng) {
  try {
    if (!photonDisponible()) throw new Error("photon en cuarentena");
    return await photonReverse(lat, lng);
  } catch (e) {
    if (e.message !== "photon en cuarentena") marcarPhotonCaido();
    try {
      return await nominatimReverse(lat, lng);
    } catch {
      return null;
    }
  }
}
