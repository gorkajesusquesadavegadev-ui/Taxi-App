import { useEffect, useRef, useState, useCallback } from "react";
import Layout from "../../components/Layout.jsx";
import MapView, { LPGC } from "../../components/MapView.jsx";
import Sheet from "../../components/Sheet.jsx";
import Button from "../../components/Button.jsx";
import Badge from "../../components/Badge.jsx";
import Spinner from "../../components/Spinner.jsx";
import AddressSearch from "../../components/AddressSearch.jsx";
import ReservaModal from "../../components/ReservaModal.jsx";
import { IconCar, IconCalendar } from "../../components/icons.jsx";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client.js";
import { direccionDe } from "../../api/geo.js";
import { connectWs } from "../../api/ws.js";
import { prefs, avisar } from "../../utils/prefs.js";

const TIPO_LABEL = { TRANSFER: "Transfer", EXCURSION: "Excursión" };

const fmtEur = (v) => (v == null ? "—" : `${Number(v).toFixed(2)} €`);

const MSG_ESTADO = {
  SOLICITADO: "Buscando un taxi cercano…",
  ACEPTADO: "Taxista en camino",
  LLEGADO: "Tu taxi ha llegado",
  EN_CURSO: "Viaje en curso",
  COMPLETADO: "Viaje completado. ¡Gracias!",
  CANCELADO: "El viaje fue cancelado",
};

export default function ClienteHome() {
  const [origen, setOrigen] = useState(null);
  const [destino, setDestino] = useState(null);
  const [nearby, setNearby] = useState([]);
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
  const navigate = useNavigate();
  const wsRef = useRef(null);
  const viajeRef = useRef(null);
  viajeRef.current = viaje;
  const estadoPrev = useRef(null);

  // avisa (sonido + vibración + notificación) en cada cambio de estado relevante
  function notificarEstado(estado) {
    if (estado === estadoPrev.current) return;
    estadoPrev.current = estado;
    if (estado === "ACEPTADO") avisar("Taxi en camino", "Un taxista aceptó tu viaje.");
    if (estado === "LLEGADO") {
      avisar("¡Tu taxi ha llegado!", "El taxista te espera en el punto de recogida.");
      setLlegada(true);
    }
    if (estado === "EN_CURSO") avisar("Viaje iniciado", "¡Buen viaje!");
    if (estado === "COMPLETADO") avisar("Viaje completado", "Gracias por viajar con TAYA.");
  }

  // live socket for trip events
  useEffect(() => {
    const ws = connectWs((event, data) => {
      if (event === "trip:accepted") {
        setViaje((v) => (v ? { ...v, estado: "ACEPTADO", taxistaId: data.taxistaId } : v));
        setStatusMsg("Taxista en camino");
        notificarEstado("ACEPTADO");
      }
      if (event === "trip:location") setTaxiPos({ lat: data.lat, lng: data.lng });
      if (event === "trip:arrived") {
        setViaje((v) => (v ? { ...v, estado: "LLEGADO" } : v));
        setStatusMsg("Tu taxi ha llegado");
        notificarEstado("LLEGADO");
      }
      if (event === "trip:status") {
        const map = { ARRIVED: "LLEGADO", IN_PROGRESS: "EN_CURSO", COMPLETED: "COMPLETADO" };
        const est = map[data.status];
        setViaje((v) => (v ? { ...v, estado: est || v.estado } : v));
        if (data.status === "COMPLETED") setStatusMsg("Viaje completado. ¡Gracias!");
        if (est) notificarEstado(est);
      }
      if (event === "trip:cancelled") {
        setStatusMsg("El viaje fue cancelado");
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
        setStatusMsg((m) => MSG_ESTADO[a.estado] || m);
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

  // nearby free taxis around city center on load
  const loadNearby = useCallback(async () => {
    if (!prefs.getNearby()) {
      setNearby([]);
      return;
    }
    try {
      const t = await api.cercanos(LPGC.lat, LPGC.lng);
      setNearby(t || []);
    } catch (_) {
      /* offline-tolerant */
    }
  }, []);
  useEffect(() => {
    loadNearby();
  }, [loadNearby]);

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
      })
      .then((e) => alive && setEstimacion(e))
      .catch(() => alive && setError("No se pudo estimar la tarifa"))
      .finally(() => alive && setEstimando(false));
    return () => {
      alive = false;
    };
  }, [origen?.lat, origen?.lng, destino?.lat, destino?.lng]);

  // map click sets the point right away, then fills in the street name async
  function etiquetar(p, setter) {
    direccionDe(p.lat, p.lng).then((label) => {
      if (!label) return;
      setter((cur) => (cur && cur.lat === p.lat && cur.lng === p.lng ? { ...cur, label } : cur));
    });
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
    setEstimacion(null);
    setError("");
  }

  async function pedir() {
    if (!origen || !destino) return;
    setBusy(true);
    setError("");
    try {
      const v = await api.solicitar({
        origenLat: origen.lat,
        origenLng: origen.lng,
        destinoLat: destino.lat,
        destinoLng: destino.lng,
        // las direcciones viajan a la BD: historial y estadísticas con nombres
        origenTexto: origen.label || null,
        destinoTexto: destino.label || null,
      });
      setViaje(v);
      setStatusMsg("Buscando un taxi cercano…");
    } catch (e) {
      setError(e.message || "No se pudo pedir el taxi");
    } finally {
      setBusy(false);
    }
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
    ...nearby.map((t) => ({ id: `n-${t.taxistaId}`, lat: t.lat, lng: t.lng, kind: "nearby" })),
    // con viaje activo los puntos salen del propio viaje (cubre transfers/excursiones)
    ...(viaje
      ? [
          { id: "o", lat: viaje.origenLat, lng: viaje.origenLng, kind: "origin" },
          { id: "d", lat: viaje.destinoLat, lng: viaje.destinoLng, kind: "destino" },
        ]
      : [
          ...(origen ? [{ id: "o", ...origen, kind: "origin" }] : []),
          ...(destino ? [{ id: "d", ...destino, kind: "destino" }] : []),
        ]),
    ...(taxiPos ? [{ id: "taxi", ...taxiPos, kind: "taxi" }] : []),
  ];
  // Real road geometry from OSRM (list of [lat,lng]); straight line only as fallback.
  const route =
    viaje && rutaActiva
      ? rutaActiva.puntos.map(([lat, lng]) => ({ lat, lng }))
      : estimacion?.ruta?.length > 1
        ? estimacion.ruta.map(([lat, lng]) => ({ lat, lng }))
        : origen && destino
          ? [origen, destino]
          : null;
  const center =
    taxiPos || (viaje ? { lat: viaje.origenLat, lng: viaje.origenLng } : origen) || LPGC;

  return (
    <Layout title="Pedir taxi" framed>
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
                <p className="font-display text-sm font-extrabold leading-tight">¡Tu taxi ha llegado!</p>
                <p className="text-xs text-volcanic/70">Te espera en el punto de recogida.</p>
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
                ? "Busca, dicta o toca el mapa: recogida"
                : !destino
                  ? "Ahora el destino"
                  : "Listo para pedir"}
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
                    {TIPO_LABEL[viaje.tipo]} · {viaje.detalle} · precio cerrado
                  </span>
                )}
                <p className="text-sm text-volcanic/70">
                  {statusMsg || "Viaje en curso"}
                  {viaje.estado !== "COMPLETADO" && viaje.estado !== "CANCELADO" && (
                    <Spinner className="ml-2 h-4 w-4 align-middle" />
                  )}
                </p>
                {viaje.estado === "COMPLETADO" || viaje.estado === "CANCELADO" ? (
                  <Button full variant="dark" onClick={cancelar}>
                    Nuevo viaje
                  </Button>
                ) : (
                  <Button full variant="danger" onClick={cancelar}>
                    Cancelar viaje
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* address search: type, dictate or tap the map */}
                <div className="space-y-2">
                  <AddressSearch
                    placeholder="¿Dónde te recogemos?"
                    value={origen}
                    onSelect={setOrigen}
                    dotClass="bg-taxi"
                  />
                  <AddressSearch
                    placeholder="¿A dónde vas?"
                    value={destino}
                    onSelect={setDestino}
                    dotClass="bg-atlantic-dark"
                  />
                </div>
                {(origen || destino) && (
                  <button
                    onClick={reset}
                    className="text-sm font-semibold text-atlantic-dark underline-offset-2 hover:underline"
                  >
                    Reiniciar puntos
                  </button>
                )}

                {/* estimate: time + distance + price, Google-style */}
                <div className="flex items-center justify-between rounded-2xl bg-sand px-4 py-3">
                  {estimando ? (
                    <>
                      <span className="text-sm font-semibold text-volcanic/70">Calculando ruta…</span>
                      <Spinner className="h-4 w-4" />
                    </>
                  ) : estimacion ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-semibold text-volcanic/70">Estimado</span>
                      <span className="text-sm text-volcanic/40">elige origen y destino</span>
                    </>
                  )}
                </div>

                {error && <p className="text-sm font-medium text-coral">{error}</p>}

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    disabled={!origen || !destino}
                    onClick={() => setReservando(true)}
                  >
                    <IconCalendar width={16} height={16} /> Reservar
                  </Button>
                  <Button
                    full
                    className="col-span-2"
                    disabled={!origen || !destino || busy}
                    onClick={pedir}
                  >
                    {busy ? <Spinner className="border-volcanic/30 border-t-volcanic" /> : null}
                    Pedir ahora
                  </Button>
                </div>
                <p className="text-center text-[11px] text-volcanic/45">
                  El precio final lo marca el taxímetro al llegar.
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
