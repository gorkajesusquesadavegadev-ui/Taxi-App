import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import MapView, { LPGC } from "../components/MapView.jsx";
import Spinner from "../components/Spinner.jsx";
import { api } from "../api/client.js";

const ESTADO_TXT = {
  ACEPTADO: "El taxi va de camino a la recogida",
  LLEGADO: "El taxi ha llegado al punto de recogida",
  EN_CURSO: "Viaje en curso",
  COMPLETADO: "Viaje completado",
  CANCELADO: "El viaje fue cancelado",
  SOLICITADO: "Buscando taxi…",
};

export default function Seguir() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    const cargar = async () => {
      try {
        const d = await api.seguir(token);
        if (alive.current) setData(d);
      } catch (e) {
        if (alive.current) setError("Enlace no válido o caducado.");
      }
    };
    cargar();
    const id = setInterval(cargar, 4000);
    return () => { alive.current = false; clearInterval(id); };
  }, [token]);

  if (error) {
    return (
      <div className="grid h-[100dvh] place-items-center bg-cream p-6 text-center">
        <div>
          <p className="font-display text-xl font-extrabold text-volcanic">CanaryCab</p>
          <p className="mt-2 text-volcanic/60">{error}</p>
        </div>
      </div>
    );
  }
  if (!data) {
    return <div className="grid h-[100dvh] place-items-center bg-volcanic"><Spinner /></div>;
  }

  const taxi = data.taxiLat != null ? { lat: data.taxiLat, lng: data.taxiLng } : null;
  const terminado = data.estado === "COMPLETADO" || data.estado === "CANCELADO";
  const markers = [
    { id: "o", lat: data.origenLat, lng: data.origenLng, kind: "origin" },
    { id: "d", lat: data.destinoLat, lng: data.destinoLng, kind: "destino" },
    ...(taxi ? [{ id: "t", ...taxi, kind: "taxi" }] : []),
  ];
  const center = taxi || { lat: data.origenLat, lng: data.origenLng } || LPGC;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-cream">
      <div className="absolute inset-0">
        <MapView center={center} markers={markers} follow={!!taxi} />
      </div>
      {/* cabecera */}
      <div className="absolute inset-x-0 top-0 z-[600] p-3" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
        <div className="mx-auto max-w-md rounded-2xl bg-white/95 px-4 py-3 shadow-float backdrop-blur">
          <p className="font-display text-sm font-extrabold text-volcanic">🚕 Seguimiento en vivo · CanaryCab</p>
          <p className="mt-0.5 text-xs text-volcanic/60">{ESTADO_TXT[data.estado] || "—"}</p>
        </div>
      </div>
      {/* tarjeta inferior */}
      {!terminado && (
        <div className="absolute inset-x-0 bottom-0 z-[600] p-3" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          <div className="mx-auto max-w-md rounded-2xl bg-white px-4 py-3 shadow-float">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-display text-base font-extrabold text-volcanic">{data.taxistaNombre || "Taxista"}</p>
                {data.modelo && <p className="truncate text-sm text-volcanic/60">{data.modelo}</p>}
              </div>
              {data.matricula && (
                <span className="shrink-0 rounded-lg border-2 border-volcanic bg-white px-2.5 py-1 font-mono text-base font-black tracking-wider text-volcanic">
                  {data.matricula}
                </span>
              )}
            </div>
            {data.estado === "ACEPTADO" && data.etaMin != null && (
              <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-volcanic px-3 py-1 font-display text-xs font-extrabold text-taxi">
                ⏱️ llega en {data.etaMin} min
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
