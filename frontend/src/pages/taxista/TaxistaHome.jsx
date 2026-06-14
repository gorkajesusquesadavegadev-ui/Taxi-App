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

const fmtEur = (v) => (v == null ? "—" : `${Number(v).toFixed(2)} €`);
const TIPO_LABEL = { TRANSFER: "Transfer", EXCURSION: "Excursión" };

// Toggle pill for online/offline.
function OnlineToggle({ online, onToggle }) {
  return (
    <button
      onClick={onToggle}
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
  // el estado en línea persiste entre recargas; se reafirma en el backend al conectar
  const [online, setOnline] = useState(() => localStorage.getItem("taya:online") === "1");
  const [pos] = useState(LPGC); // MVP: fixed position (geolocation deferred)
  const [incoming, setIncoming] = useState(null); // trip:new payload
  const [viaje, setViaje] = useState(null);
  const [routeGeo, setRouteGeo] = useState(null); // real road geometry for the active trip
  const [rutaInfo, setRutaInfo] = useState(null); // {min, km} via OSRM
  const [dirs, setDirs] = useState(null); // {o, d} reverse-geocoded addresses
  const [zonas, setZonas] = useState(null); // demanda: zonas calientes del big data
  const [msg, setMsg] = useState("Conéctate para recibir viajes.");
  const wsRef = useRef(null);
  const viajeRef = useRef(null);
  viajeRef.current = viaje;

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
    const id = setInterval(cargar, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // socket lifecycle tied to online state
  useEffect(() => {
    if (!online) return;
    // reafirmar LIBRE al conectar (recarga incluida), salvo que haya un viaje
    // activo asignado: en ese caso seguimos OCUPADO conduciéndolo
    api
      .taxistaActivo()
      .then((v) => {
        if (!v) api.estado({ estado: "LIBRE", lat: pos.lat, lng: pos.lng }).catch(() => {});
      })
      .catch(() => {});
    const ws = connectWs(
      (event, data) => {
        if (event === "trip:new") {
          setIncoming(data);
          if (prefs.getSound()) beep();
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
        if (state === "open") setMsg("Conectado. Esperando viajes…");
      }
    );
    wsRef.current = ws;

    // stream location + heartbeat while online
    const locId = setInterval(() => ws.send("location:update", { lat: pos.lat, lng: pos.lng }), 3000);
    const hbId = setInterval(() => ws.send("heartbeat", {}), 30000);
    ws.send("location:update", { lat: pos.lat, lng: pos.lng });

    return () => {
      clearInterval(locId);
      clearInterval(hbId);
      ws.close();
    };
  }, [online, pos]);

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
    try {
      const v = await api.aceptar(incoming.viajeId);
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
    { id: "me", ...pos, kind: "taxi" },
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
          <MapView center={pos} markers={markers} route={route} zonas={zonas} />
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
              <p className="text-xs font-semibold uppercase tracking-wider text-atlantic-dark">
                {TIPO_LABEL[incoming.tipo] ? `Solicitud de ${TIPO_LABEL[incoming.tipo]}` : "Nuevo viaje"}
              </p>
              {incoming.detalle && (
                <p className="mt-0.5 font-display text-base font-extrabold text-volcanic">
                  {incoming.detalle}
                </p>
              )}
              <p className="mt-1 font-display text-2xl font-extrabold">
                {fmtEur(incoming.precioEstimado)}
                <span className="ml-2 text-sm font-medium text-volcanic/50">
                  {TIPO_LABEL[incoming.tipo] ? "precio cerrado" : "estimado"}
                </span>
              </p>
              <p className="mt-1 text-sm text-volcanic/60">
                Recogida marcada en el mapa · viaje #{incoming.viajeId}
              </p>
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
            )}
        </Sheet>
      </div>
    </Layout>
  );
}
