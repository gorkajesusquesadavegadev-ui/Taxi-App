import { useEffect, useRef, useState } from "react";
import Layout from "../../components/Layout.jsx";
import MapView, { LPGC } from "../../components/MapView.jsx";
import Sheet from "../../components/Sheet.jsx";
import Button from "../../components/Button.jsx";
import Badge from "../../components/Badge.jsx";
import { IconCar } from "../../components/icons.jsx";
import { api } from "../../api/client.js";
import { direccionDe } from "../../api/geo.js";
import { connectWs } from "../../api/ws.js";
import { prefs, beep, avisar } from "../../utils/prefs.js";
import ValorarViaje from "../../components/ValorarViaje.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const fmtEur = (v) => (v == null ? "—" : `${Number(v).toFixed(2)} €`);
const TIPO_LABEL = { TRANSFER: "Transfer", EXCURSION: "Excursión" };

const _ISLAS = [
  { id: "GC", latMin: 27.70, latMax: 28.20, lngMin: -15.85, lngMax: -15.30 },
  { id: "TF", latMin: 27.90, latMax: 28.60, lngMin: -16.95, lngMax: -16.10 },
  { id: "LZ", latMin: 28.75, latMax: 29.25, lngMin: -13.95, lngMax: -13.40 },
  { id: "FV", latMin: 27.60, latMax: 28.75, lngMin: -14.55, lngMax: -13.70 },
  { id: "LP", latMin: 28.40, latMax: 28.95, lngMin: -17.95, lngMax: -17.60 },
  { id: "GO", latMin: 28.00, latMax: 28.30, lngMin: -17.45, lngMax: -17.00 },
  { id: "EH", latMin: 27.60, latMax: 27.95, lngMin: -18.20, lngMax: -17.85 },
];
const _CENTROS = [
  [28.123, -15.432, 7.0], [28.463, -16.251, 7.0], [28.487, -16.313, 5.0],
  [28.963, -13.548, 5.0], [28.499, -13.862, 5.0], [28.684, -17.764, 4.0],
  [28.091, -17.113, 3.5], [27.807, -17.912, 3.0],
];
function calcZona(oLat, oLng, dLat, dLng) {
  if (oLat == null) return null;
  const islaDeL = (lat, lng) => _ISLAS.find(i => lat >= i.latMin && lat <= i.latMax && lng >= i.lngMin && lng <= i.lngMax)?.id;
  const urbano = (lat, lng) => _CENTROS.some(([cLat, cLng, r]) => Math.hypot((lat - cLat) * 111, (lng - cLng) * 96) <= r);
  const oI = islaDeL(oLat, oLng), dI = islaDeL(dLat, dLng);
  if (!oI || !dI || oI !== dI) return "Interinsular · Fuera del municipio";
  if (urbano(oLat, oLng) && urbano(dLat, dLng)) return "Tarifa 1 · Zona urbana";
  return "Tarifa 3 · Zona periférica";
}

// Toggle pill for online/offline.
function OnlineToggle({ online, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={online}
      aria-label={online ? "En línea, toca para desconectar" : "Desconectado, toca para conectar"}
      className={`pill border-2 transition-colors ${
        online
          ? "border-palm bg-palm/15 text-palm"
          : "border-volcanic/15 bg-white text-volcanic/55"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${online ? "bg-palm animate-pulse" : "bg-volcanic/30"}`} />
      {online ? "En línea" : "Desconectado"}
    </button>
  );
}

export default function TaxistaHome() {
  const { user } = useAuth();
  const [online, setOnline] = useState(() => localStorage.getItem("taya:online") === "1");
  const [pos, setPos] = useState(null); // null = sin fix GPS real todavía
  const [incoming, setIncoming] = useState(null); // trip:new payload
  const [viaje, setViaje] = useState(null);
  const [routeGeo, setRouteGeo] = useState(null); // real road geometry for the active trip
  const [rutaInfo, setRutaInfo] = useState(null); // {min, km} via OSRM
  const [dirs, setDirs] = useState(null); // {o, d} reverse-geocoded addresses for active trip
  const [incomingDirs, setIncomingDirs] = useState(null); // {o, d} for incoming offer
  const [zonas, setZonas] = useState(null); // demanda: zonas calientes del big data
  const [msg, setMsg] = useState("Conéctate para recibir viajes.");
  const wsRef = useRef(null);
  const viajeRef = useRef(null);
  viajeRef.current = viaje;
  const posRef = useRef(pos);
  posRef.current = pos;

  // Fetch the real road route (OSRM) for the active trip so the taxista sees the
  // same street-following line as the client, not a straight segment.
  useEffect(() => {
    if (!viaje) {
      setRouteGeo(null);
      setRutaInfo(null);
      setDirs(null);
      return;
    }
    let alive = true;
    // ruta del servidor: en ofertas incluye las paradas reales de la excursión
    api
      .rutaViaje(viaje.id)
      .then((r) => {
        if (!alive) return;
        if (r?.puntos?.length > 1) setRouteGeo(r.puntos.map(([lat, lng]) => ({ lat, lng })));
        if (r?.duracionMin != null)
          setRutaInfo({ min: Math.round(Number(r.duracionMin)), km: Number(r.km) });
      })
      .catch(() => {});
    // street names of pickup & dropoff for the driver
    Promise.all([
      direccionDe(viaje.origenLat, viaje.origenLng),
      direccionDe(viaje.destinoLat, viaje.destinoLng),
    ])
      .then(([o, d]) => alive && setDirs({ o, d }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [viaje?.id]);

  // reverse-geocode origin + destination when a new trip offer arrives
  useEffect(() => {
    if (!incoming) { setIncomingDirs(null); return; }
    let alive = true;
    setIncomingDirs(null);
    Promise.all([
      direccionDe(incoming.origenLat, incoming.origenLng),
      direccionDe(incoming.destinoLat, incoming.destinoLng),
    ])
      .then(([o, d]) => alive && setIncomingDirs({ o, d }))
      .catch(() => {});
    return () => { alive = false; };
  }, [incoming?.viajeId]);

  // GPS real del taxista. Rechaza fixes basura (geolocalización por IP da
  // accuracy de miles de m): un taxi DEBE publicar su posición real, no una
  // aproximación de ciudad — si no, el cliente lo ve donde no está.
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) => {
        if (p.coords.accuracy > 1000) return; // IP-based garbage, ignorar
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // Si el taxista se puso online antes de tener GPS, el handler "open" no pudo
  // afirmar LIBRE. En cuanto llega el primer fix, lo afirmamos (una sola vez).
  const libreAfirmado = useRef(false);
  useEffect(() => {
    if (!online) { libreAfirmado.current = false; return; }
    if (!pos || libreAfirmado.current) return;
    libreAfirmado.current = true;
    api.taxistaActivo()
      .then((v) => {
        if (!v) {
          api.estado({ estado: "LIBRE", lat: pos.lat, lng: pos.lng }).catch(() => {});
          wsRef.current?.send("location:update", { lat: pos.lat, lng: pos.lng });
          setMsg("Conectado. Esperando viajes…");
        }
      })
      .catch(() => {});
  }, [online, pos]);

  // demand heatmap: refreshed every 60s (history decay + live events)
  useEffect(() => {
    let alive = true;
    const load = () =>
      api
        .zonasCalientes()
        .then((z) => alive && setZonas(z))
        .catch(() => {});
    load();
    const id = setInterval(load, 60000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // viaje ya asignado (p.ej. una reserva que llegó a su hora): cargar al entrar
  // y sondear, para que el taxista lo conduzca aunque no estuviera "online".
  useEffect(() => {
    let alive = true;
    const cargar = () =>
      api
        .taxistaActivo()
        .then((v) => {
          if (alive && v) setViaje((cur) => (cur && cur.id === v.id ? cur : v));
        })
        .catch(() => {});
    cargar();
    const id = setInterval(cargar, 2000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // Polling fallback: every 5s check for trips missed by WS (iOS background, reconnect gap)
  const incomingRef = useRef(null);
  incomingRef.current = incoming;
  useEffect(() => {
    if (!online) return;
    const id = setInterval(async () => {
      if (incomingRef.current || viajeRef.current) return; // already have a trip
      try {
        const pend = await api.pendienteCercano();
        if (pend && !incomingRef.current) {
          // pendienteCercano devuelve ViajeResponse (campo `id`); el resto del
          // componente espera el shape del payload WS trip:new (campo `viajeId`).
          setIncoming({ ...pend, viajeId: pend.viajeId ?? pend.id });
          if (prefs.getSound()) beep();
          if (navigator.vibrate) navigator.vibrate([400, 150, 400]);
        }
      } catch (_) {}
    }, 5000);
    return () => clearInterval(id);
  }, [online]);

  // socket lifecycle — pos leído de posRef para no reiniciar WS en cada GPS update
  useEffect(() => {
    if (!online) return;

    const ws = connectWs(
      (event, data) => {
        if (event === "trip:new") {
          setIncoming(data);
          if (prefs.getSound()) beep();
          if (navigator.vibrate) navigator.vibrate([400, 150, 400]);
          // ACK inmediato: backend sabe que el mensaje llegó
          wsRef.current?.send("trip:ack", { viajeId: data.viajeId });
        }
        if (event === "trip:assigned") {
          avisar("Reserva activa", `${data.detalle || "Tu reserva"} comienza ahora.`, "viaje");
          api.taxistaActivo().then((v) => v && setViaje(v)).catch(() => {});
        }
        if (event === "trip:cancelled") {
          setViaje(null);
          setIncoming(null);
          setMsg("El cliente canceló el viaje.");
        }
      },
      (state) => {
        if (state === "open") {
          const p = posRef.current;
          if (!p) { setMsg("Conectado. Buscando señal GPS…"); return; }
          setMsg("Conectado. Esperando viajes…");
          // re-afirmar LIBRE en cada (re)conexión, salvo viaje activo
          api.taxistaActivo()
            .then((v) => {
              if (!v) api.estado({ estado: "LIBRE", lat: p.lat, lng: p.lng }).catch(() => {});
            })
            .catch(() => {});
          ws.send("location:update", { lat: p.lat, lng: p.lng });
        }
      }
    );
    wsRef.current = ws;

    // Solo publica posición con fix GPS real (posRef no-null): nunca una posición falsa.
    const locId = setInterval(() => {
      const p = posRef.current;
      if (p) ws.send("location:update", { lat: p.lat, lng: p.lng });
    }, 3000);
    const hbId = setInterval(() => ws.send("heartbeat", {}), 25_000);

    return () => {
      clearInterval(locId);
      clearInterval(hbId);
      ws.close();
    };
  }, [online]); // pos via posRef — nunca cierra el WS por cambio de GPS

  async function toggleOnline() {
    try {
      if (!online) {
        // el WS effect reafirma LIBRE al activarse; aquí solo persistimos
        localStorage.setItem("taya:online", "1");
        setOnline(true);
      } else {
        await api.estado({ estado: "DESCONECTADO" });
        localStorage.setItem("taya:online", "0");
        setOnline(false);
        setMsg("Desconectado.");
      }
    } catch (e) {
      setMsg(e.message || "Error de conexión");
    }
  }

  async function aceptar() {
    if (!incoming) return;
    const id = incoming.viajeId ?? incoming.id;
    if (!id) { setIncoming(null); setMsg("Solicitud inválida."); return; }
    try {
      const v = await api.aceptar(id);
      setViaje(v);
      setIncoming(null);
      setMsg("Viaje aceptado. Dirígete a la recogida.");
    } catch (e) {
      setIncoming(null);
      setMsg(e.status === 409 ? "Otro taxista lo tomó primero." : "No se pudo aceptar.");
    }
  }

  async function avanzar(fn, label) {
    try {
      const v = await fn(viaje.id);
      setViaje(v);
      setMsg(label);
    } catch (e) {
      setMsg(e.message || "Error");
    }
  }

  async function finalizar() {
    try {
      // el backend tarifica con la distancia OSRM real del viaje
      const v = await api.finalizar(viaje.id);
      setViaje(v);
      setMsg(`Completado · ${fmtEur(v.precioFinal)} · ${Number(v.distanciaRealKm).toFixed(1)} km`);
    } catch (e) {
      setMsg(e.message || "Error al finalizar");
    }
  }

  const markers = [
    ...(pos ? [{ id: "me", ...pos, kind: "taxi" }] : []),
    ...(viaje ? [{ id: "o", lat: viaje.origenLat, lng: viaje.origenLng, kind: "origin" }] : []),
    ...(viaje ? [{ id: "d", lat: viaje.destinoLat, lng: viaje.destinoLng, kind: "destino" }] : []),
  ];
  const route = viaje
    ? routeGeo ?? [
        { lat: viaje.origenLat, lng: viaje.origenLng },
        { lat: viaje.destinoLat, lng: viaje.destinoLng },
      ]
    : null;

  return (
    <Layout title="Conducir" framed action={<OnlineToggle online={online} onToggle={toggleOnline} />}>
      <div className="relative h-full">
        <div className="absolute inset-0">
          <MapView center={pos ?? LPGC} markers={markers} route={route} zonas={zonas} />
        </div>

        {/* leyenda de demanda */}
        {zonas?.length > 0 && (
          <div className="glass pointer-events-none absolute right-3 top-3 z-[500] rounded-2xl px-3 py-2 shadow-card">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-volcanic/50">
              Demanda
            </p>
            <div className="mt-1 space-y-0.5 text-[11px] font-semibold text-volcanic/75">
              <p><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full" style={{ background: "#E03131" }} />Alta</p>
              <p><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full" style={{ background: "#F08C00" }} />Media</p>
              <p><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full" style={{ background: "#FFC400" }} />Baja</p>
            </div>
          </div>
        )}

        {/* incoming trip modal */}
        {incoming && (
          <div className="absolute inset-0 z-[700] grid place-items-end bg-volcanic/40 p-3 backdrop-blur-sm sm:place-items-center">
            <div className="w-full max-w-md animate-pop rounded-[1.7rem] bg-cream p-5 shadow-float ring-4 ring-taxi/70 lg:p-6">

              {/* tipo + badge */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-atlantic-dark">
                  {TIPO_LABEL[incoming.tipo] ? `Solicitud de ${TIPO_LABEL[incoming.tipo]}` : "Nuevo viaje"}
                </p>
                <span className="rounded-full bg-taxi/20 px-2.5 py-0.5 text-[11px] font-extrabold text-volcanic">
                  #{incoming.viajeId}
                </span>
              </div>

              {incoming.detalle && (
                <p className="mt-0.5 font-display text-base font-extrabold text-volcanic">
                  {incoming.detalle}
                </p>
              )}

              {/* precio */}
              <p className="mt-2 font-display text-3xl font-extrabold text-volcanic">
                {fmtEur(incoming.precioEstimado)}
                <span className="ml-2 text-sm font-medium text-volcanic/45">
                  {TIPO_LABEL[incoming.tipo] ? "precio cerrado" : "estimado"}
                </span>
              </p>

              {/* zona tarifaria — badge prominente */}
              <div className="mt-2 flex items-center gap-2 rounded-xl bg-atlantic/10 px-3 py-2">
                <span className="text-lg">🏷️</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-volcanic/40">Tarifa aplicada</p>
                  <p className="text-sm font-extrabold text-atlantic-dark">
                    {incoming.zona || calcZona(incoming.origenLat, incoming.origenLng, incoming.destinoLat, incoming.destinoLng) || "—"}
                  </p>
                </div>
              </div>

              {/* origen → destino */}
              <div className="mt-3 rounded-2xl bg-sand px-4 py-3">
                {incomingDirs ? (
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center pt-1 shrink-0">
                      <span className="h-2.5 w-2.5 rounded-full bg-taxi shadow-sun" />
                      <span className="my-1 h-6 w-px border-l-2 border-dashed border-volcanic/25" />
                      <span className="h-2.5 w-2.5 rounded-full bg-atlantic-dark" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-2 text-sm">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-volcanic/40">Recogida</p>
                        <p className="font-semibold text-volcanic leading-tight">{incomingDirs.o || "Punto de recogida"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-volcanic/40">Destino</p>
                        <p className="font-semibold text-volcanic leading-tight">{incomingDirs.d || "Destino"}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-volcanic/50">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-volcanic/20 border-t-volcanic/60" />
                    Cargando ruta…
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setIncoming(null)}>
                  Rechazar
                </Button>
                <Button onClick={aceptar}>Aceptar</Button>
              </div>
            </div>
          </div>
        )}

        {/* bottom status / lifecycle sheet */}
        <Sheet>
          {viaje && viaje.estado !== "COMPLETADO" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge estado={viaje.estado} />
                  <span className="font-display text-lg font-extrabold">
                    {fmtEur(viaje.precioFinal ?? viaje.precioEstimado)}
                  </span>
                </div>
                {TIPO_LABEL[viaje.tipo] && (
                  <span className="pill bg-taxi/20 text-volcanic">
                    {TIPO_LABEL[viaje.tipo]} · {viaje.detalle}
                  </span>
                )}
                {rutaInfo && (
                  <p className="font-display text-sm font-extrabold text-atlantic-dark">
                    {rutaInfo.min} min
                    <span className="ml-1.5 font-body text-xs font-medium text-volcanic/50">
                      {rutaInfo.km.toFixed(1)} km
                    </span>
                  </p>
                )}
                {dirs && (dirs.o || dirs.d) && (
                  <div className="flex items-start gap-2.5 text-xs">
                    <div className="flex flex-col items-center pt-1">
                      <span className="h-2 w-2 rounded-full bg-taxi" />
                      <span className="my-0.5 h-4 w-px bg-volcanic/20" />
                      <span className="h-2 w-2 rounded-full bg-atlantic-dark" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="truncate font-semibold">{dirs.o || "Punto de recogida"}</p>
                      <p className="truncate font-semibold">{dirs.d || "Destino"}</p>
                    </div>
                  </div>
                )}
                <p className="text-sm text-volcanic/70">{msg}</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    variant={viaje.estado === "ACEPTADO" ? "primary" : "outline"}
                    disabled={viaje.estado !== "ACEPTADO"}
                    onClick={() => avanzar(api.llegada, "Has llegado a la recogida.")}
                  >
                    Llegué
                  </Button>
                  <Button
                    size="sm"
                    variant={viaje.estado === "LLEGADO" ? "primary" : "outline"}
                    disabled={viaje.estado !== "LLEGADO"}
                    onClick={() => avanzar(api.iniciar, "Viaje iniciado.")}
                  >
                    Iniciar
                  </Button>
                  <Button
                    size="sm"
                    variant={viaje.estado === "EN_CURSO" ? "primary" : "outline"}
                    disabled={viaje.estado !== "EN_CURSO"}
                    onClick={finalizar}
                  >
                    Finalizar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
                      online ? "bg-atlantic/15 text-atlantic-dark" : "bg-volcanic/10 text-volcanic/50"
                    }`}
                  >
                    <IconCar />
                  </span>
                  <div className="min-w-0">
                    <p className="font-display font-bold">
                      {viaje?.estado === "COMPLETADO" ? "Carrera completada" : online ? "En línea" : "Desconectado"}
                    </p>
                    <p className="truncate text-sm text-volcanic/60">{msg}</p>
                  </div>
                  {viaje?.estado === "COMPLETADO" && (
                    <Button size="sm" variant="dark" className="ml-auto" onClick={() => setViaje(null)}>
                      Listo
                    </Button>
                  )}
                </div>
                {viaje?.estado === "COMPLETADO" && viaje.clienteId && (
                  <ValorarViaje viajeId={viaje.id} etiqueta="el cliente" />
                )}
                {!viaje && online && user && user.verificado === false && (
                  <div className="rounded-2xl bg-coral/10 px-4 py-3 text-sm">
                    <p className="font-bold text-coral">Cuenta pendiente de verificación</p>
                    <p className="mt-0.5 text-xs text-volcanic/60">
                      No recibirás viajes hasta que un administrador apruebe tu licencia. Te avisaremos.
                    </p>
                  </div>
                )}
              </div>
            )}
        </Sheet>
      </div>
    </Layout>
  );
}
