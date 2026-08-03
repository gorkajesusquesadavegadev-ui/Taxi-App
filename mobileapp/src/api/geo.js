// Geocodificación — espejo de frontend/src/api/geo.js (GPS: expo-location).
import * as Location from "expo-location";

const CARTOCIUDAD = "https://www.cartociudad.es/geocoder/api/geocoder";
// Photon (Komoot) — buscador OSM para autocompletado: tolera texto a medias
// ("mesa y lop") y sin tildes, y devuelve la CALLE con coordenadas en una sola
// petición. Fuente principal de calles (ver nota larga en frontend/src/api/geo.js).
const PHOTON = "https://photon.komoot.io/api";
const BBOX_CANARIAS = "-18.3,27.5,-13.3,29.5";
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
    const label = title(x.address || "");
    if (!label) continue;
    const lat = Number(x.lat);
    const lng = Number(x.lng);
    // Las CALLES (type=callejero) vienen sin coordenadas — solo los portales
    // las traen. Antes se descartaban y por eso el buscador no encontraba
    // calles; ahora se guardan y se resuelven con /find solo al elegirlas.
    const sinCoords = !lat || !lng || Math.abs(lat) < 0.001;
    out.push({
      lat: sinCoords ? null : lat,
      lng: sinCoords ? null : lng,
      label,
      exacto: CARTO_TIPO_EXACTO.has(x.type),
      porResolver: sinCoords,
    });
  }
  return out;
}

// Photon acotado a Canarias por bbox (sin él devuelve calles de la península).
async function buscarPhoton(q) {
  const r = await fetch(`${PHOTON}/?q=${encodeURIComponent(q)}&limit=10&bbox=${BBOX_CANARIAS}`, { headers: UA });
  if (!r.ok) return [];
  const d = await r.json();
  const out = [];
  for (const f of d.features || []) {
    const p = f.properties || {};
    const [lng, lat] = f.geometry?.coordinates || [];
    if (!lat || !lng) continue;
    if (p.countrycode && p.countrycode !== "ES") continue;
    // Los portales no traen name, solo street + housenumber: se compone
    // "Calle X 5" en vez de dejar el número suelto delante.
    const principal = p.name
      ? [p.name, p.housenumber].filter(Boolean).join(" ").trim()
      : [p.street, p.housenumber].filter(Boolean).join(" ").trim();
    const via = p.name && p.street && p.street !== p.name ? p.street : "";
    const label = [principal, via, p.district, p.city]
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 3)
      .join(", ");
    if (!label) continue;
    out.push({ lat, lng, label });
  }
  return out;
}

/** Rellena las coordenadas de una calle del callejero (que llega sin ellas). */
export async function resolverPunto(p) {
  if (!p || !p.porResolver) return p;
  try {
    const r = await fetch(`${CARTOCIUDAD}/findJsonp?q=${encodeURIComponent(p.label)}`, { headers: UA });
    if (!r.ok) return null;
    const d = parseJsonp(await r.text());
    const lat = Number(d?.lat);
    const lng = Number(d?.lng);
    if (!lat || !lng || Math.abs(lat) < 0.001) return null;
    return { lat, lng, label: p.label };
  } catch (_) {
    return null;
  }
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

// "Avenida José Mesa y López" y "AVENIDA JOSE MESA Y LOPEZ" son la misma calle.
function claveDedupe(label) {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Autocomplete: query → [{lat, lng, label, porResolver?}].
 * Los tres buscadores a la vez (si uno falla, responden los otros), ordenados
 * por confianza: portal exacto de Cartociudad > Photon (calles y sitios, único
 * que encuentra escribiendo a medias) > POIs de Nominatim > callejero oficial
 * sin coords (se resuelven al elegir) > topónimos vagos.
 */
export async function buscarDirecciones(q) {
  const [carto, photon, osm] = await Promise.all([
    buscarCartociudad(q).catch(() => []),
    buscarPhoton(q).catch(() => []),
    buscarNominatim(q).catch(() => []),
  ]);

  const portales = carto.filter((x) => x.exacto && !x.porResolver);
  const callejero = carto.filter((x) => x.exacto && x.porResolver);
  const vagos = carto.filter((x) => !x.exacto);

  const seen = new Set();
  const out = [];
  for (const x of [...portales, ...photon, ...osm, ...callejero, ...vagos]) {
    const k = claveDedupe(x.label);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push({ lat: x.lat, lng: x.lng, label: x.label, porResolver: !!x.porResolver });
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
