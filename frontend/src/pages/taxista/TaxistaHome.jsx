import { useEffect, useRef, useState } from "react";
import Layout from "../../components/Layout.jsx";
import MapView, { LPGC } from "../../components/MapView.jsx";
import Sheet from "../../components/Sheet.jsx";
import Button from "../../components/Button.jsx";
import Badge from "../../components/Badge.jsx";
import { api } from "../../api/client.js";
import { connectWs } from "../../api/ws.js";

const fmtEur = (v) => (v == null ? "—" : `${Number(v).toFixed(2)} €`);

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
  const [online, setOnline] = useState(false);
  const [pos] = useState(LPGC); // MVP: fixed position (geolocation deferred)
  const [incoming, setIncoming] = useState(null); // trip:new payload
  const [viaje, setViaje] = useState(null);
  const [msg, setMsg] = useState("Conéctate para recibir viajes.");
  const wsRef = useRef(null);
  const viajeRef = useRef(null);
  viajeRef.current = viaje;

  // socket lifecycle tied to online state
  useEffect(() => {
    if (!online) return;
    const ws = connectWs(
      (event, data) => {
        if (event === "trip:new") setIncoming(data);
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
        await api.estado({ estado: "LIBRE", lat: pos.lat, lng: pos.lng });
        setOnline(true);
      } else {
        await api.estado({ estado: "DESCONECTADO" });
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
    const km = parseFloat(prompt("Kilómetros recorridos (taxímetro):", "4.0"));
    if (!km || km <= 0) return;
    try {
      const v = await api.finalizar(viaje.id, km);
      setViaje(v);
      setMsg(`Completado · ${fmtEur(v.precioFinal)}`);
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
    ? [
        { lat: viaje.origenLat, lng: viaje.origenLng },
        { lat: viaje.destinoLat, lng: viaje.destinoLng },
      ]
    : null;

  return (
    <Layout title="Conducir" framed action={<OnlineToggle online={online} onToggle={toggleOnline} />}>
      <div className="relative h-full">
        <div className="absolute inset-0">
          <MapView center={pos} markers={markers} route={route} />
        </div>

        {/* incoming trip modal */}
        {incoming && (
          <div className="absolute inset-0 z-[700] grid place-items-end bg-volcanic/40 p-3 backdrop-blur-sm sm:place-items-center">
            <div className="w-full animate-fade-up rounded-[1.5rem] bg-cream p-5 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wider text-atlantic-dark">
                Nuevo viaje
              </p>
              <p className="mt-1 font-display text-2xl font-extrabold">
                {fmtEur(incoming.precioEstimado)}
                <span className="ml-2 text-sm font-medium text-volcanic/50">estimado</span>
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
                    {fmtEur(viaje.precioEstimado)}
                  </span>
                </div>
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
                    online ? "bg-palm/15 text-palm" : "bg-volcanic/10 text-volcanic/50"
                  }`}
                >
                  {online ? "📡" : "💤"}
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
