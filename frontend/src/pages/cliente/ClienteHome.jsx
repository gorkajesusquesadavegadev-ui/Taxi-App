import { useEffect, useRef, useState } from "react";
import Layout from "../../components/Layout.jsx";
import MapView, { LPGC } from "../../components/MapView.jsx";
import Sheet from "../../components/Sheet.jsx";
import Button from "../../components/Button.jsx";
import Badge from "../../components/Badge.jsx";
import Spinner from "../../components/Spinner.jsx";
import AddressSearch from "../../components/AddressSearch.jsx";
import ReservaModal from "../../components/ReservaModal.jsx";
import ValorarViaje from "../../components/ValorarViaje.jsx";
import FavoritosBar from "../../components/FavoritosBar.jsx";
import { IconCar, IconCalendar } from "../../components/icons.jsx";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client.js";
import { direccionDe, ubicacionPrecisa } from "../../api/geo.js";
import { activarPush } from "../../api/push.js";
import { tapLigero, tapFuerte } from "../../utils/haptics.js";
import { useI18n, zonaTraducida } from "../../i18n/index.jsx";
import { connectWs } from "../../api/ws.js";
import { avisar } from "../../utils/prefs.js";

const TIPO_LABEL = { TRANSFER: "Transfer", EXCURSION: "Excursión" };

const fmtEur = (v) => (v == null ? "—" : `${Number(v).toFixed(2)} €`);

const ISLAS = [
  { id: "GC", latMin: 27.70, latMax: 28.20, lngMin: -15.85, lngMax: -15.30 },
  { id: "TF", latMin: 27.90, latMax: 28.60, lngMin: -16.95, lngMax: -16.10 },
  { id: "LZ", latMin: 28.75, latMax: 29.25, lngMin: -13.95, lngMax: -13.40 },
  { id: "FV", latMin: 27.60, latMax: 28.75, lngMin: -14.55, lngMax: -13.70 },
  { id: "LP", latMin: 28.40, latMax: 28.95, lngMin: -17.95, lngMax: -17.60 },
  { id: "GO", latMin: 28.00, latMax: 28.30, lngMin: -17.45, lngMax: -17.00 },
  { id: "EH", latMin: 27.60, latMax: 27.95, lngMin: -18.20, lngMax: -17.85 },
];
const CENTROS = [
  [28.123, -15.432, 7.0], [28.463, -16.251, 7.0], [28.487, -16.313, 5.0],
  [28.963, -13.548, 5.0], [28.499, -13.862, 5.0], [28.684, -17.764, 4.0],
  [28.091, -17.113, 3.5], [27.807, -17.912, 3.0],
];
const islaDeL = (lat, lng) => ISLAS.find(i => lat >= i.latMin && lat <= i.latMax && lng >= i.lngMin && lng <= i.lngMax)?.id;
const esUrbano = (lat, lng) => CENTROS.some(([cLat, cLng, r]) => Math.hypot((lat - cLat) * 111, (lng - cLng) * 96) <= r);

function calcZona(oLat, oLng, dLat, dLng) {
  const oI = islaDeL(oLat, oLng), dI = islaDeL(dLat, dLng);
  if (!oI || !dI || oI !== dI) return "Interinsular · Fuera del municipio";
  if (esUrbano(oLat, oLng) && esUrbano(dLat, dLng)) return "Tarifa 1 · Zona urbana";
  return "Tarifa 3 · Zona periférica";
}

const LANDMARKS = [
  { id: "teide",      lat: 28.2723, lng: -16.6407, kind: "poi", label: "Teide · Tenerife" },
  { id: "roque",      lat: 27.9673, lng: -15.6105, kind: "poi", label: "Roque Nublo · Gran Canaria" },
  { id: "maspalomas", lat: 27.7376, lng: -15.5843, kind: "poi", label: "Dunas de Maspalomas" },
  { id: "timanfaya",  lat: 29.0142, lng: -13.7591, kind: "poi", label: "Timanfaya · Lanzarote" },
  { id: "garajonay",  lat: 28.1119, lng: -17.2440, kind: "poi", label: "Garajonay · La Gomera" },
  { id: "taburiente", lat: 28.7200, lng: -17.8770, kind: "poi", label: "Caldera de Taburiente · La Palma" },
  { id: "corralejo",  lat: 28.7292, lng: -13.8694, kind: "poi", label: "Corralejo · Fuerteventura" },
  { id: "hierro",     lat: 27.7327, lng: -18.0349, kind: "poi", label: "El Hierro" },
];

const MSG_ESTADO = {
  SOLICITADO: "ride.searching", ACEPTADO: "ride.driverOnWay", LLEGADO: "ride.arrived",
  EN_CURSO: "ride.inProgress", COMPLETADO: "ride.completed", CANCELADO: "ride.cancelled",
};

export default function ClienteHome() {
  const { t } = useI18n();
  const [origen, setOrigen] = useState(null);
  const [destino, setDestino] = useState(null);
  const [userPos, setUserPos] = useState(LPGC);
  const [taxisOnline, setTaxisOnline] = useState([]);
  const [estimacion, setEstimacion] = useState(null);
  const [estimando, setEstimando] = useState(false);
  const [viaje, setViaje] = useState(null);
  const [rutaActiva, setRutaActiva] = useState(null); // ruta servidor del viaje activo (con paradas)
  const [taxiPos, setTaxiPos] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [llegada, setLlegada] = useState(false); // banner "tu taxi ha llegado"
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reservando, setReservando] = useState(false);
  const [sinTaxi, setSinTaxi] = useState(false); // true tras 45s sin taxista
  const [localizando, setLocalizando] = useState(false); // GPS en curso para "mi ubicación"
  const [accesible, setAccesible] = useState(false); // requiere taxi adaptado
  const [paradas, setParadas] = useState([]); // multiparada (puntos intermedios)
  const [fidelidad, setFidelidad] = useState(null);
  const navigate = useNavigate();
  const wsRef = useRef(null);
  const userPosRef = useRef(LPGC);
  userPosRef.current = userPos;
  const viajeRef = useRef(null);
  viajeRef.current = viaje;
  const estadoPrev = useRef(null);

  // avisa (sonido + vibración + notificación) en cada cambio de estado relevante
  function notificarEstado(estado) {
    if (estado === estadoPrev.current) return;
    estadoPrev.current = estado;
    if (estado === "ACEPTADO") avisar(t("ride.notifAcceptedT"), t("ride.notifAcceptedD"));
    if (estado === "LLEGADO") {
      avisar(t("ride.notifArrivedT"), t("ride.notifArrivedD"));
      setLlegada(true);
    }
    if (estado === "EN_CURSO") avisar(t("ride.notifStartedT"), t("ride.notifStartedD"));
    if (estado === "COMPLETADO") avisar(t("ride.notifCompletedT"), t("ride.notifCompletedD"));
  }

  // live socket for trip events
  useEffect(() => {
    const ws = connectWs((event, data) => {
      if (event === "trip:accepted") {
        setViaje((v) => (v ? { ...v, estado: "ACEPTADO", taxistaId: data.taxistaId } : v));
        setStatusMsg(t("ride.driverOnWay"));
        notificarEstado("ACEPTADO");
        // recarga el viaje completo: trae matrícula, modelo y licencia del taxista
        const vid = viajeRef.current?.id ?? data.viajeId;
        if (vid) api.viaje(vid).then((full) => full && setViaje(full)).catch(() => {});
      }
      if (event === "trip:location") setTaxiPos({ lat: data.lat, lng: data.lng });
      if (event === "trip:arrived") {
        setViaje((v) => (v ? { ...v, estado: "LLEGADO" } : v));
        setStatusMsg(t("ride.arrived"));
        notificarEstado("LLEGADO");
      }
      if (event === "trip:status") {
        const map = { ARRIVED: "LLEGADO", IN_PROGRESS: "EN_CURSO", COMPLETED: "COMPLETADO" };
        const est = map[data.status];
        setViaje((v) => (v ? { ...v, estado: est || v.estado } : v));
        if (data.status === "COMPLETED") setStatusMsg(t("ride.completed"));
        if (est) notificarEstado(est);
      }
      if (event === "trip:cancelled") {
        setStatusMsg(t("ride.cancelled"));
        setViaje(null);
        setTaxiPos(null);
        setLlegada(false);
        estadoPrev.current = null;
      }
    });
    wsRef.current = ws;
    return () => ws.close();
  }, []);

  // REST resync: source of truth so the client is always informed, even if a
  // live WebSocket event is missed (reconnect, restart) or the page reloads.
  // With an active trip we poll it BY ID: /activo can't return terminal states
  // (COMPLETADO/CANCELADO), so polling only /activo strands the client at the end.
  useEffect(() => {
    let alive = true;
    const sync = async () => {
      try {
        const cur = viajeRef.current;
        const a = cur ? await api.viaje(cur.id) : await api.activo();
        if (!alive || !a) return;
        setViaje((c) =>
          !c || c.id !== a.id || c.estado !== a.estado || c.precioFinal !== a.precioFinal
            ? a
            : c
        );
        setStatusMsg((m) => (MSG_ESTADO[a.estado] ? t(MSG_ESTADO[a.estado]) : m));
        notificarEstado(a.estado); // red de seguridad si el evento WS se perdió
      } catch (_) {
        /* keep current state on transient error */
      }
    };
    sync();
    const id = setInterval(sync, 2000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // route of the active trip from the server: for catálogo trips it includes
  // the excursion's real stops, so the map shows the full circuit
  useEffect(() => {
    if (!viaje) {
      setRutaActiva(null);
      return;
    }
    let alive = true;
    api
      .rutaViaje(viaje.id)
      .then((r) => alive && r?.puntos?.length > 1 && setRutaActiva(r))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [viaje?.id]);

  // GPS real del cliente: centra el mapa en su mejor posición disponible
  useEffect(() => {
    let alive = true;
    ubicacionPrecisa({ maxWaitMs: 6000 }).then((fix) => {
      if (alive && fix) setUserPos({ lat: fix.lat, lng: fix.lng });
    });
    return () => { alive = false; };
  }, []);

  // fidelidad: nivel + progreso a viaje gratis (se refresca al cerrar un viaje)
  useEffect(() => {
    let alive = true;
    if (viaje && viaje.estado !== "COMPLETADO") return;
    api.fidelidad().then((f) => alive && setFidelidad(f)).catch(() => {});
    return () => { alive = false; };
  }, [viaje?.estado]);

  // taxis online (libres + en viaje) — refresca cada 8 s
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const t = await api.taxistasOnline(userPosRef.current.lat, userPosRef.current.lng);
        if (alive) setTaxisOnline(t || []);
      } catch (_) {}
    };
    load();
    const id = setInterval(load, 8000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  // auto-estimate when both points set (keyed on coords: label updates must not refetch)
  useEffect(() => {
    if (!origen || !destino) {
      setEstimacion(null);
      return;
    }
    let alive = true;
    setEstimando(true);
    api
      .estimar({
        origenLat: origen.lat,
        origenLng: origen.lng,
        destinoLat: destino.lat,
        destinoLng: destino.lng,
        paradas: paradas.filter(Boolean).map((p) => [p.lat, p.lng]),
      })
      .then((e) => alive && setEstimacion(e))
      .catch(() => alive && setError(t("ride.errEstimate")))
      .finally(() => alive && setEstimando(false));
    return () => {
      alive = false;
    };
  }, [origen?.lat, origen?.lng, destino?.lat, destino?.lng, paradas]);

  // map click sets the point right away, then fills in the street name async
  function etiquetar(p, setter) {
    direccionDe(p.lat, p.lng).then((label) => {
      if (!label) return;
      setter((cur) => (cur && cur.lat === p.lat && cur.lng === p.lng ? { ...cur, label } : cur));
    });
  }

  // "Usar mi ubicación": GPS de alta precisión → origen con calle reverse-geocodeada
  async function usarMiUbicacion() {
    if (viaje || localizando) return;
    setLocalizando(true);
    setError("");
    try {
      const fix = await ubicacionPrecisa();
      if (!fix) { setError(t("ride.errLocGps")); return; }
      const punto = { lat: fix.lat, lng: fix.lng, label: "" };
      setOrigen(punto);
      setUserPos({ lat: fix.lat, lng: fix.lng });
      etiquetar(punto, setOrigen);
      // Aviso honesto si el GPS es impreciso (interiores, primer fix flojo)
      if (fix.accuracy > 80) {
        setError(`Ubicación aproximada (±${Math.round(fix.accuracy)} m). Ajusta el punto en el mapa si hace falta.`);
      }
    } catch (_) {
      setError(t("ride.errLoc"));
    } finally {
      setLocalizando(false);
    }
  }

  // Compartir viaje en vivo: genera token y abre el menú de compartir / copia link
  async function compartirViaje() {
    if (!viaje) return;
    tapLigero();
    try {
      const { token } = await api.compartirViaje(viaje.id);
      const url = `${window.location.origin}/seguir/${token}`;
      const texto = t("ride.shareText", { url });
      if (navigator.share) {
        await navigator.share({ title: t("ride.shareTitle"), text: texto, url });
      } else {
        await navigator.clipboard.writeText(url);
        setStatusMsg(t("ride.linkCopied"));
      }
    } catch (_) {
      setStatusMsg(t("ride.linkFail"));
    }
  }

  // SOS: comparte ubicación + datos del taxi por WhatsApp y permite llamar al 112
  function sos() {
    if (!viaje) return;
    tapFuerte();
    const pos = taxiPos || { lat: viaje.origenLat, lng: viaje.origenLng };
    const mapa = `https://maps.google.com/?q=${pos.lat},${pos.lng}`;
    const datos =
      t("ride.sosText") +
      (viaje.taxistaNombre ? ` ${t("ride.sosDriver")}: ${viaje.taxistaNombre}.` : "") +
      (viaje.taxistaMatricula ? ` ${t("ride.sosPlate")}: ${viaje.taxistaMatricula}.` : "") +
      (viaje.taxistaLicencia ? ` ${t("ride.sosLicense")}: ${viaje.taxistaLicencia}.` : "") +
      ` ${t("ride.sosLoc")}: ${mapa}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(datos)}`, "_blank");
  }

  // Favorito elegido: rellena el primer punto libre (origen, luego destino).
  function pickFavorito(p) {
    if (viaje) return;
    if (!origen) { setOrigen(p); }
    else if (!destino) { setDestino(p); }
    else { setDestino(p); }
  }

  function onMapClick(latlng) {
    if (viaje) return; // locked during an active trip
    const punto = { ...latlng, label: "" };
    if (!origen) {
      setOrigen(punto);
      etiquetar(punto, setOrigen);
    } else if (!destino) {
      setDestino(punto);
      etiquetar(punto, setDestino);
    }
  }

  function reset() {
    setOrigen(null);
    setDestino(null);
    setParadas([]);
    setEstimacion(null);
    setError("");
  }

  // Auto-timeout: if SOLICITADO for 45s with no driver, warn the client
  useEffect(() => {
    if (!viaje || viaje.estado !== "SOLICITADO") { setSinTaxi(false); return; }
    const t = setTimeout(() => setSinTaxi(true), 45_000);
    return () => clearTimeout(t);
  }, [viaje?.id, viaje?.estado]);

  async function pedir() {
    if (!origen || !destino) return;
    tapFuerte();
    setBusy(true);
    setError("");
    setSinTaxi(false);
    try {
      const v = await api.solicitar({
        origenLat: origen.lat,
        origenLng: origen.lng,
        destinoLat: destino.lat,
        destinoLng: destino.lng,
        origenTexto: origen.label || null,
        destinoTexto: destino.label || null,
        requiereAccesible: accesible,
        paradas: paradas.filter(Boolean).map((p) => [p.lat, p.lng]),
      });
      setViaje(v);
      setStatusMsg(t("ride.searching"));
      // Web Push: avisar "taxi en camino / ha llegado" aunque cierre la app
      activarPush().catch(() => {});
    } catch (e) {
      setError(e.message || t("ride.errRequest"));
    } finally {
      setBusy(false);
    }
  }

  async function reintentar() {
    if (!viaje) return;
    try { await api.cancelar(viaje.id); } catch (_) {}
    setViaje(null);
    setSinTaxi(false);
    setStatusMsg("");
    await pedir();
  }

  async function confirmarReserva({ programadaPara, notas }) {
    await api.reservarCrear({
      tipo: "NORMAL",
      origenLat: origen.lat,
      origenLng: origen.lng,
      origenTexto: origen.label || null,
      destinoLat: destino.lat,
      destinoLng: destino.lng,
      destinoTexto: destino.label || null,
      programadaPara,
      notas,
    });
    setReservando(false);
    navigate("/reservas");
  }

  async function cancelar() {
    if (!viaje) return;
    // Only call the API for trips still cancelable. A COMPLETADO/CANCELADO trip
    // returns 409; "Nuevo viaje" just needs a local reset, not a cancel call.
    if (viaje.estado !== "COMPLETADO" && viaje.estado !== "CANCELADO") {
      try {
        await api.cancelar(viaje.id);
      } catch (_) {
        /* ignore */
      }
    }
    setViaje(null);
    setTaxiPos(null);
    setStatusMsg("");
    setLlegada(false);
    estadoPrev.current = null;
    reset();
  }

  const markers = [
    // puntos de interés de Canarias (siempre visibles en el mapa)
    ...LANDMARKS,
    // taxis online: amarillo = libre, gris = en viaje
    ...taxisOnline.map((t) => ({
      id: `t-${t.taxistaId}`,
      lat: t.lat,
      lng: t.lng,
      kind: t.enViaje ? "carOcupado" : "taxi",
    })),
    // con viaje activo los puntos salen del propio viaje (cubre transfers/excursiones)
    ...(viaje
      ? [
          { id: "o", lat: viaje.origenLat, lng: viaje.origenLng, kind: "origin" },
          { id: "d", lat: viaje.destinoLat, lng: viaje.destinoLng, kind: "destino" },
        ]
      : [
          ...(origen ? [{ id: "o", ...origen, kind: "origin" }] : []),
          ...paradas.filter(Boolean).map((p, i) => ({ id: `p${i}`, lat: p.lat, lng: p.lng, kind: "destino" })),
          ...(destino ? [{ id: "d", ...destino, kind: "destino" }] : []),
        ]),
    ...(taxiPos ? [{ id: "taxi-activo", ...taxiPos, kind: "taxi" }] : []),
  ];
  const route =
    viaje && rutaActiva
      ? rutaActiva.puntos.map(([lat, lng]) => ({ lat, lng }))
      : estimacion?.ruta?.length > 1
        ? estimacion.ruta.map(([lat, lng]) => ({ lat, lng }))
        : origen && destino
          ? [origen, destino]
          : null;
  const center =
    taxiPos || (viaje ? { lat: viaje.origenLat, lng: viaje.origenLng } : origen) || userPos;

  // ETA en vivo del taxi al punto de recogida (haversine + velocidad urbana
  // media ~22 km/h; mínimo 1 min). Se recalcula al moverse el taxi.
  const etaMin = (() => {
    if (!taxiPos || !viaje || viaje.estado !== "ACEPTADO") return null;
    const R = 6371, toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(viaje.origenLat - taxiPos.lat);
    const dLng = toRad(viaje.origenLng - taxiPos.lng);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(taxiPos.lat)) * Math.cos(toRad(viaje.origenLat)) * Math.sin(dLng / 2) ** 2;
    const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.max(1, Math.round((km / 22) * 60));
  })();

  return (
    <Layout title={t("nav.ride")} framed>
      <div className="relative h-full">
        {/* map fills the content area */}
        <div className="absolute inset-0">
          <MapView
            center={center}
            markers={markers}
            route={route}
            onClick={onMapClick}
            follow={!!taxiPos}
          />
        </div>

        {/* banner prominente: el taxi ha llegado */}
        {llegada && viaje?.estado === "LLEGADO" && (
          <div className="absolute inset-x-3 top-3 z-[650] flex animate-fade-up justify-center">
            <div className="flex items-center gap-3 rounded-2xl bg-taxi px-4 py-3 text-volcanic shadow-float ring-2 ring-volcanic/10">
              <span className="grid h-9 w-9 shrink-0 animate-pulse place-items-center rounded-xl bg-volcanic text-taxi">
                <IconCar width={20} height={20} />
              </span>
              <div className="min-w-0">
                <p className="font-display text-sm font-extrabold leading-tight">{t("ride.arrivedBannerT")}</p>
                <p className="text-xs text-volcanic/70">{t("ride.arrivedBannerD")}</p>
              </div>
              <button
                onClick={() => setLlegada(false)}
                className="ml-1 shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-volcanic/60 hover:bg-volcanic/10"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* floating helper chip */}
        {!viaje && (
          <div className="pointer-events-none absolute inset-x-3 top-3 z-[500] flex justify-center">
            <span className="pill max-w-full bg-volcanic/90 text-center text-cream shadow-card">
              {!origen
                ? t("ride.helperPickup")
                : !destino
                  ? t("ride.helperDest")
                  : t("ride.helperReady")}
            </span>
          </div>
        )}

        {/* bottom sheet */}
        <Sheet>
          {viaje ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge estado={viaje.estado} />
                  <span className="font-display text-lg font-extrabold">
                    {fmtEur(viaje.precioFinal ?? viaje.precioEstimado)}
                  </span>
                </div>
                {TIPO_LABEL[viaje.tipo] && (
                  <span className="pill bg-taxi/20 text-volcanic">
                    {viaje.tipo === "EXCURSION" ? t("res.excursion") : TIPO_LABEL[viaje.tipo]} · {viaje.detalle} · {t("ride.closedPrice")}
                  </span>
                )}
                <p className="text-sm text-volcanic/70">
                  {statusMsg || t("ride.inProgress")}
                  {viaje.estado !== "COMPLETADO" && viaje.estado !== "CANCELADO" && (
                    <Spinner className="ml-2 h-4 w-4 align-middle" />
                  )}
                </p>
                {/* Taxista asignado: matrícula + licencia + contacto */}
                {viaje.taxistaId && ["ACEPTADO", "LLEGADO", "EN_CURSO"].includes(viaje.estado) && (
                  <div className="rounded-2xl border-2 border-taxi/40 bg-taxi/10 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-volcanic/55">
                        {t("ride.yourTaxi")}
                      </p>
                      {viaje.estado === "ACEPTADO" && etaMin != null && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-volcanic px-2.5 py-1 font-display text-xs font-extrabold text-taxi">
                          ⏱️ {t("ride.arrivesIn", { min: etaMin })}
                        </span>
                      )}
                      {viaje.estado === "LLEGADO" && (
                        <span className="rounded-full bg-palm px-2.5 py-1 text-xs font-extrabold text-white">{t("ride.hasArrived")}</span>
                      )}
                    </div>
                    {/* Matrícula GIGANTE parpadeando: se tiene que leer de un vistazo desde lejos */}
                    {viaje.taxistaMatricula && (
                      <div className="animate-pulse mt-1.5 flex items-center justify-center rounded-2xl border-4 border-volcanic bg-white py-3 shadow-md">
                        <span className="font-mono text-6xl font-black leading-none tracking-[0.08em] text-volcanic sm:text-7xl">
                          {viaje.taxistaMatricula}
                        </span>
                      </div>
                    )}
                    {/* Nº de licencia, también grande y parpadeando */}
                    {viaje.taxistaLicencia && (
                      <div className="animate-pulse mt-1.5 flex items-center justify-center gap-1.5 rounded-xl border-2 border-volcanic/70 bg-taxi py-1.5">
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-volcanic/70">
                          {t("ride.licensePrefix")}
                        </span>
                        <span className="font-mono text-2xl font-black leading-none tracking-wider text-volcanic sm:text-3xl">
                          {viaje.taxistaLicencia}
                        </span>
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate font-display text-base font-extrabold text-volcanic">
                          {viaje.taxistaNombre || "Taxista"}
                          {viaje.taxistaVerificado && (
                            <span title={t("ride.verifiedTaxi")} className="text-palm">✓</span>
                          )}
                        </p>
                        <p className="truncate text-sm font-medium text-volcanic/65">
                          {viaje.taxistaModelo || ""}
                          {viaje.taxistaRatingCount > 0 && (
                            <span className="ml-1 font-bold text-volcanic/80">· ⭐ {viaje.taxistaRating} ({viaje.taxistaRatingCount})</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {viaje.taxistaTelefono && (
                        <a
                          href={`tel:${viaje.taxistaTelefono}`}
                          className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-volcanic px-3 py-1.5 text-sm font-extrabold text-cream transition active:scale-95"
                        >
                          📞 {t("ride.call")}
                        </a>
                      )}
                    </div>
                  </div>
                )}
                {/* Compartir viaje en vivo + SOS (durante el trayecto) */}
                {["ACEPTADO", "LLEGADO", "EN_CURSO"].includes(viaje.estado) && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={compartirViaje}
                      className="flex items-center justify-center gap-2 rounded-2xl border border-sand-deep bg-white py-2.5 text-sm font-bold text-volcanic transition-colors hover:border-atlantic hover:bg-atlantic/10"
                    >
                      🔗 {t("ride.share")}
                    </button>
                    <button
                      onClick={sos}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-coral/15 py-2.5 text-sm font-extrabold text-coral transition-colors hover:bg-coral/25"
                    >
                      🆘 {t("ride.sos")}
                    </button>
                  </div>
                )}
                {/* Sin taxista tras 45s → mostrar opción de reintento */}
                {sinTaxi && viaje.estado === "SOLICITADO" && (
                  <div className="rounded-xl bg-taxi/15 px-3 py-2.5 text-sm">
                    <p className="font-semibold text-volcanic">{t("ride.noTaxisNear")}</p>
                    <p className="mt-0.5 text-xs text-volcanic/60">{t("ride.stillSearching")}</p>
                    <button
                      onClick={reintentar}
                      className="mt-2 w-full rounded-xl bg-taxi py-2 font-bold text-volcanic transition active:scale-95"
                    >
                      {t("ride.retrySearch")}
                    </button>
                  </div>
                )}
                {viaje.estado === "COMPLETADO" && viaje.taxistaId && (
                  <ValorarViaje viajeId={viaje.id} etiqueta={t("rate.theTrip")} invitarGoogle />
                )}
                {viaje.estado === "COMPLETADO" || viaje.estado === "CANCELADO" ? (
                  <Button full variant="dark" onClick={cancelar}>
                    {t("ride.newTrip")}
                  </Button>
                ) : (
                  <Button full variant="danger" onClick={cancelar}>
                    {t("ride.cancelTrip")}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* address search: type, dictate or tap the map */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={usarMiUbicacion}
                    disabled={localizando}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-atlantic/10 px-3 py-2.5 text-sm font-extrabold text-atlantic-dark transition-colors hover:bg-atlantic/20 disabled:opacity-60"
                  >
                    {localizando ? (
                      <><Spinner className="h-4 w-4" /> {t("ride.locating")}</>
                    ) : (
                      <>📍 {t("ride.useMyLocation")}</>
                    )}
                  </button>
                  <AddressSearch
                    placeholder={t("ride.pickupPh")}
                    value={origen}
                    onSelect={setOrigen}
                    dotClass="bg-taxi"
                  />
                  {paradas.map((p, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="flex-1">
                        <AddressSearch
                          placeholder={t("ride.stopPh", { n: i + 1 })}
                          value={p}
                          onSelect={(pt) => setParadas((arr) => arr.map((x, j) => (j === i ? pt : x)))}
                          dotClass="bg-volcanic"
                        />
                      </div>
                      <button
                        onClick={() => setParadas((arr) => arr.filter((_, j) => j !== i))}
                        aria-label={t("ride.stopPh", { n: i + 1 })}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sand text-volcanic/60 hover:bg-coral/15 hover:text-coral"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <AddressSearch
                    placeholder={t("ride.destPh")}
                    value={destino}
                    onSelect={setDestino}
                    dotClass="bg-atlantic-dark"
                  />
                  {paradas.length < 3 && (
                    <button
                      onClick={() => setParadas((arr) => [...arr, null])}
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-atlantic-dark underline-offset-2 hover:underline"
                    >
                      ➕ {t("ride.addStop")}
                    </button>
                  )}
                </div>
                {(origen || destino) && (
                  <button
                    onClick={reset}
                    className="text-sm font-semibold text-atlantic-dark underline-offset-2 hover:underline"
                  >
                    {t("ride.resetPoints")}
                  </button>
                )}

                {/* favoritos: un toque rellena origen/destino; guarda el punto elegido */}
                <FavoritosBar onPick={pickFavorito} puntoParaGuardar={destino || origen} />

                {/* taxi adaptado: solo despacha a vehículos accesibles */}
                <button
                  onClick={() => setAccesible((a) => !a)}
                  aria-pressed={accesible}
                  className={`flex w-full items-center gap-2 rounded-2xl border-2 px-3 py-2 text-sm font-bold transition-colors ${
                    accesible ? "border-atlantic bg-atlantic/10 text-atlantic-dark" : "border-sand-deep bg-white text-volcanic/60"
                  }`}
                >
                  <span className="text-base">♿</span>
                  {t("ride.needAccessible")}
                  <span className={`ml-auto h-5 w-9 rounded-full p-0.5 transition-colors ${accesible ? "bg-atlantic" : "bg-volcanic/20"}`}>
                    <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${accesible ? "translate-x-4" : ""}`} />
                  </span>
                </button>

                {/* fidelidad: nivel + progreso a viaje gratis */}
                {fidelidad && fidelidad.completados > 0 && (
                  <div className="rounded-2xl border border-taxi/40 bg-taxi/10 px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold text-volcanic">
                        {fidelidad.nivel === "Oro" ? "🥇" : fidelidad.nivel === "Plata" ? "🥈" : "🥉"} Cliente {fidelidad.nivel}
                      </span>
                      <span className="text-xs font-semibold text-volcanic/60">{fidelidad.completados} viajes</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white">
                      <div className="h-full rounded-full bg-taxi" style={{ width: `${(fidelidad.progreso / 10) * 100}%` }} />
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-volcanic/60">
                      {fidelidad.faltanParaRecompensa === 0
                        ? t("ride.freeRideReady")
                        : t("ride.toNextFree", { n: fidelidad.faltanParaRecompensa })}
                    </p>
                  </div>
                )}

                {/* estimate: time + distance + price, Google-style */}
                <div className="flex items-center justify-between rounded-2xl bg-sand px-4 py-3">
                  {estimando ? (
                    <>
                      <span className="text-sm font-semibold text-volcanic/70">{t("ride.calcRoute")}</span>
                      <Spinner className="h-4 w-4" />
                    </>
                  ) : estimacion ? (
                    <div className="flex w-full flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-display text-lg font-extrabold text-atlantic-dark">
                          {estimacion.duracionMin != null && Number(estimacion.duracionMin) > 0 && (
                            <>{Math.max(1, Math.round(Number(estimacion.duracionMin)))} min</>
                          )}
                          <span className="ml-1.5 text-xs font-medium text-volcanic/50">
                            {Number(estimacion.distanciaKm).toFixed(1)} km
                          </span>
                        </span>
                        <span className="font-display text-lg font-extrabold">
                          {fmtEur(estimacion.precioEstimado)}
                        </span>
                      </div>
                      {/* tarifa aplicada */}
                      {(estimacion.zona || (origen && destino)) && (
                        <div className="flex items-center gap-1.5 rounded-xl bg-atlantic/10 px-3 py-1.5">
                          <span className="text-base">🏷️</span>
                          <span className="text-[12px] font-extrabold text-atlantic-dark">
                            {zonaTraducida(t, estimacion.zona || calcZona(origen.lat, origen.lng, destino.lat, destino.lng))}
                          </span>
                        </div>
                      )}
                      {/* suplementos oficiales ya incluidos en el precio (transparencia) */}
                      {estimacion.suplementos && (
                        <p className="px-1 text-[11px] font-medium text-volcanic/45">
                          {t("ride.suplementosIncl", { detalle: estimacion.suplementos })}
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-semibold text-volcanic/70">{t("ride.estimated")}</span>
                      <span className="text-sm text-volcanic/40">{t("ride.pickOriginDest")}</span>
                    </>
                  )}
                </div>

                {error && <p className="text-sm font-medium text-coral">{error}</p>}

                {/* Taxis disponibles ahora mismo */}
                {taxisOnline.length > 0 && (
                  <p className="text-center text-xs font-semibold text-palm">
                    {taxisOnline.filter(tx => !tx.enViaje).length > 0
                      ? t("ride.taxisFree", { n: taxisOnline.filter(tx => !tx.enViaje).length })
                      : t("ride.taxisBusy", { n: taxisOnline.length })}
                  </p>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    disabled={!origen || !destino}
                    onClick={() => setReservando(true)}
                  >
                    <IconCalendar width={16} height={16} /> {t("ride.book")}
                  </Button>
                  <Button
                    full
                    className="col-span-2"
                    disabled={!origen || !destino || busy}
                    onClick={pedir}
                  >
                    {busy ? <Spinner className="border-volcanic/30 border-t-volcanic" /> : null}
                    {t("ride.requestNow")}
                  </Button>
                </div>
                <p className="text-center text-[11px] text-volcanic/45">
                  {t("ride.meterNote")}
                </p>
              </div>
            )}
        </Sheet>

        {reservando && (
          <ReservaModal
            titulo="Reservar viaje"
            subtitulo={
              estimacion
                ? `${Number(estimacion.distanciaKm).toFixed(1)} km · ${fmtEur(estimacion.precioEstimado)} estimado`
                : "Elige cuándo te recogemos"
            }
            onConfirm={confirmarReserva}
            onClose={() => setReservando(false)}
          />
        )}
      </div>
    </Layout>
  );
}
