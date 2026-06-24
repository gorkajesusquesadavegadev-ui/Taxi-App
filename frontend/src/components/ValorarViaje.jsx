import { useEffect, useState } from "react";
import { api } from "../api/client.js";

/**
 * Tarjeta de valoración tras un viaje completado. Comprueba si el usuario aún
 * puede valorar (backend) y muestra 5★ + comentario. Se oculta si ya valoró.
 */
export default function ValorarViaje({ viajeId, etiqueta = "tu viaje" }) {
  const [pendiente, setPendiente] = useState(false);
  const [estrellas, setEstrellas] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!viajeId) return;
    api.valoracionPendiente(viajeId).then((p) => alive && setPendiente(!!p)).catch(() => {});
    return () => { alive = false; };
  }, [viajeId]);

  if (!pendiente || enviado) {
    return enviado ? (
      <div className="rounded-2xl bg-palm/10 px-4 py-3 text-center text-sm font-bold text-palm">
        ¡Gracias por tu valoración! ⭐
      </div>
    ) : null;
  }

  async function enviar() {
    if (estrellas < 1) return;
    setBusy(true);
    try {
      await api.valorar(viajeId, estrellas, comentario);
      setEnviado(true);
    } catch (_) {
      setEnviado(true); // si ya estaba valorado, ocultar igualmente
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-taxi/40 bg-white p-4 shadow-card">
      <p className="text-center text-sm font-extrabold text-volcanic">¿Qué tal {etiqueta}?</p>
      <div className="mt-2 flex justify-center gap-1.5" role="radiogroup" aria-label="Puntuación">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={estrellas === n}
            aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
            onClick={() => setEstrellas(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="text-3xl leading-none transition-transform active:scale-90"
          >
            <span className={(hover || estrellas) >= n ? "text-taxi" : "text-volcanic/20"}>★</span>
          </button>
        ))}
      </div>
      <input
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        maxLength={500}
        placeholder="Comentario (opcional)"
        className="mt-3 w-full rounded-xl border-2 border-sand-deep bg-cream px-3 py-2 text-sm outline-none focus:border-taxi"
      />
      <button
        onClick={enviar}
        disabled={estrellas < 1 || busy}
        className="mt-2.5 w-full rounded-xl bg-volcanic py-2.5 font-extrabold text-cream transition active:scale-95 disabled:opacity-50"
      >
        Enviar valoración
      </button>
    </div>
  );
}
