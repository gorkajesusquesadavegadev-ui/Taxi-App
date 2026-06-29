import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { toast } from "../utils/toast.js";
import { tapExito } from "../utils/haptics.js";

const ICONO = (et) => {
  const e = (et || "").toLowerCase();
  if (e.includes("casa") || e.includes("hogar")) return "🏠";
  if (e.includes("trabajo") || e.includes("curro") || e.includes("oficina")) return "💼";
  if (e.includes("aero") || e.includes("aeropuerto")) return "✈️";
  if (e.includes("gym") || e.includes("gimnasio")) return "🏋️";
  return "⭐";
};

/**
 * Barra de direcciones favoritas del cliente. Tocar un favorito lo pasa a
 * onPick. Permite guardar el punto actual (origen/destino elegido) con nombre.
 */
export default function FavoritosBar({ onPick, puntoParaGuardar }) {
  const [favs, setFavs] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [etiqueta, setEtiqueta] = useState("");

  async function cargar() {
    try { setFavs((await api.favoritos()) || []); } catch (_) {}
  }
  useEffect(() => { cargar(); }, []);

  async function guardar() {
    const p = puntoParaGuardar;
    if (!p || !etiqueta.trim()) return;
    try {
      await api.favoritoCrear({ etiqueta: etiqueta.trim(), direccion: p.label || null, lat: p.lat, lng: p.lng });
      setEtiqueta(""); setGuardando(false); cargar();
      tapExito();
      toast("Favorito guardado", `"${etiqueta.trim()}" añadido`, "success");
    } catch (err) {
      toast("No se pudo guardar", err.message || "Inténtalo de nuevo", "error");
    }
  }

  async function borrar(id, e) {
    e.stopPropagation();
    try { await api.favoritoBorrar(id); cargar(); }
    catch (err) { toast("No se pudo borrar", err.message || "", "error"); }
  }

  if (favs.length === 0 && !puntoParaGuardar) return null;

  return (
    <div className="space-y-2">
      {favs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {favs.map((f) => (
            <button
              key={f.id}
              onClick={() => onPick({ lat: f.lat, lng: f.lng, label: f.direccion || f.etiqueta })}
              className="group inline-flex items-center gap-1.5 rounded-full border border-sand-deep bg-white px-3 py-1.5 text-sm font-semibold text-volcanic transition-colors hover:border-taxi hover:bg-taxi/10"
            >
              <span>{ICONO(f.etiqueta)}</span>
              <span className="max-w-[8rem] truncate">{f.etiqueta}</span>
              <span
                onClick={(e) => borrar(f.id, e)}
                className="ml-0.5 text-volcanic/30 hover:text-coral"
                aria-label={`Borrar ${f.etiqueta}`}
                role="button"
              >
                ×
              </span>
            </button>
          ))}
        </div>
      )}

      {puntoParaGuardar && (
        guardando ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              value={etiqueta}
              onChange={(e) => setEtiqueta(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && guardar()}
              maxLength={40}
              placeholder="Nombre (Casa, Trabajo…)"
              className="min-w-0 flex-1 rounded-xl border-2 border-taxi bg-white px-3 py-1.5 text-sm outline-none"
            />
            <button onClick={guardar} className="rounded-xl bg-volcanic px-3 py-1.5 text-sm font-bold text-cream">Guardar</button>
            <button onClick={() => setGuardando(false)} aria-label="Cancelar" className="rounded-xl bg-sand px-2.5 py-1.5 text-sm font-bold text-volcanic">×</button>
          </div>
        ) : (
          <button
            onClick={() => setGuardando(true)}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-atlantic-dark underline-offset-2 hover:underline"
          >
            ⭐ Guardar esta dirección como favorita
          </button>
        )
      )}
    </div>
  );
}
