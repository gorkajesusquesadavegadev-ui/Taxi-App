import { useEffect, useRef, useState, useCallback } from "react";
import Layout from "../../components/Layout.jsx";
import MapView, { LPGC } from "../../components/MapView.jsx";
import Sheet from "../../components/Sheet.jsx";
import Button from "../../components/Button.jsx";
import Badge from "../../components/Badge.jsx";
import Spinner from "../../components/Spinner.jsx";
import { api } from "../../api/client.js";
import { connectWs } from "../../api/ws.js";

const fmtEur = (v) => (v == null ? "—" : `${Number(v).toFixed(2)} €`);

export default function ClienteHome() {
  const [origen, setOrigen] = useState(null);
  const [destino, setDestino] = useState(null);
  const [nearby, setNearby] = useState([]);
  const [estimacion, setEstimacion] = useState(null);
  const [estimando, setEstimando] = useState(false);
  const [viaje, setViaje] = useState(null);
  const [taxiPos, setTaxiPos] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const wsRef = useRef(null);

  // live socket for trip events
  useEffect(() => {
    const ws = connectWs((event, data) => {
      if (event === "trip:accepted") setStatusMsg(`Taxista #${data.taxistaId} en camino`);
      if (event === "trip:location") setTaxiPos({ lat: data.lat, lng: data.lng });
      if (event === "trip:arrived") setStatusMsg("Tu taxi ha llegado 🎉");
      if (event === "trip:status") {
        const map = { ARRIVED: "LLEGADO", IN_PROGRESS: "EN_CURSO", COMPLETED: "COMPLETADO" };
        setViaje((v) => (v ? { ...v, estado: map[data.status] || v.estado } : v));
        if (data.status === "COMPLETED") setStatusMsg("Viaje completado. ¡Gracias!");
      }
      if (event === "trip:cancelled") {
        setStatusMsg("El viaje fue cancelado");
        setViaje(null);
        setTaxiPos(null);
      }
    });
    wsRef.current = ws;
    return () => ws.close();
  }, []);

  // nearby free taxis around city center on load
  const loadNearby = useCallback(async () => {
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

  // auto-estimate when both points set
  useEffect(() => {
    if (!origen || !destino) return;
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
  }, [origen, destino]);

  function onMapClick(latlng) {
    if (viaje) return; // locked during an active trip
    if (!origen) setOrigen(latlng);
    else if (!destino) setDestino(latlng);
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
      });
      setViaje(v);
      setStatusMsg("Buscando un taxi cercano…");
    } catch (e) {
      setError(e.message || "No se pudo pedir el taxi");
    } finally {
      setBusy(false);
    }
  }

  async function cancelar() {
    if (!viaje) return;
    try {
      await api.cancelar(viaje.id);
    } catch (_) {
      /* ignore */
    }
    setViaje(null);
    setTaxiPos(null);
    setStatusMsg("");
    reset();
  }

  const markers = [
    ...nearby.map((t) => ({ id: `n-${t.taxistaId}`, lat: t.lat, lng: t.lng, kind: "nearby" })),
    ...(origen ? [{ id: "o", ...origen, kind: "origin" }] : []),
    ...(destino ? [{ id: "d", ...destino, kind: "destino" }] : []),
    ...(taxiPos ? [{ id: "taxi", ...taxiPos, kind: "taxi" }] : []),
  ];
  const route = origen && destino ? [origen, destino] : null;
  const center = taxiPos || origen || LPGC;

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

        {/* floating helper chip */}
        {!viaje && (
          <div className="pointer-events-none absolute left-1/2 top-3 z-[500] -translate-x-1/2">
            <span className="pill bg-volcanic/90 text-cream shadow-card">
              {!origen
                ? "Toca el mapa: punto de recogida"
                : !destino
                  ? "Ahora toca tu destino"
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
                <p className="text-sm text-volcanic/70">
                  {statusMsg || "Viaje en curso"}
                  {viaje.estado !== "COMPLETADO" && (
                    <Spinner className="ml-2 h-4 w-4 align-middle" />
                  )}
                </p>
                {viaje.estado === "COMPLETADO" ? (
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
                {/* points summary */}
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex flex-col items-center pt-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-palm" />
                    <span className="my-1 h-6 w-px bg-volcanic/20" />
                    <span className="h-2.5 w-2.5 rounded-full bg-coral" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className={origen ? "font-semibold" : "text-volcanic/40"}>
                      {origen ? "Recogida marcada" : "Punto de recogida"}
                    </p>
                    <p className={destino ? "font-semibold" : "text-volcanic/40"}>
                      {destino ? "Destino marcado" : "Destino"}
                    </p>
                  </div>
                  {(origen || destino) && (
                    <button
                      onClick={reset}
                      className="text-sm font-semibold text-atlantic-dark underline-offset-2 hover:underline"
                    >
                      Reiniciar
                    </button>
                  )}
                </div>

                {/* estimate */}
                <div className="flex items-center justify-between rounded-2xl bg-sand px-4 py-3">
                  <span className="text-sm font-semibold text-volcanic/70">Estimado</span>
                  {estimando ? (
                    <Spinner className="h-4 w-4" />
                  ) : estimacion ? (
                    <span className="font-display text-lg font-extrabold">
                      {fmtEur(estimacion.precioEstimado)}
                      <span className="ml-1 text-xs font-medium text-volcanic/50">
                        · {Number(estimacion.distanciaKm).toFixed(1)} km
                      </span>
                    </span>
                  ) : (
                    <span className="text-sm text-volcanic/40">marca 2 puntos</span>
                  )}
                </div>

                {error && <p className="text-sm font-medium text-coral">{error}</p>}

                <Button full size="lg" disabled={!origen || !destino || busy} onClick={pedir}>
                  {busy ? <Spinner className="border-volcanic/30 border-t-volcanic" /> : null}
                  Pedir taxi
                </Button>
                <p className="text-center text-[11px] text-volcanic/45">
                  El precio final lo marca el taxímetro al llegar.
                </p>
              </div>
            )}
        </Sheet>
      </div>
    </Layout>
  );
}
