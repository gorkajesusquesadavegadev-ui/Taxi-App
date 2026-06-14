import { useState } from "react";
import Button from "./Button.jsx";
import Spinner from "./Spinner.jsx";
import { minDateTimeLocal } from "../utils/reservas.js";

/**
 * Modal para programar una reserva. onConfirm({ programadaPara, notas }).
 * programadaPara se envía en ISO/UTC (el backend valida que sea futura).
 */
export default function ReservaModal({ titulo, subtitulo, onConfirm, onClose }) {
  const [cuando, setCuando] = useState("");
  const [notas, setNotas] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const min = minDateTimeLocal();

  async function confirmar(e) {
    e.preventDefault();
    if (!cuando) {
      setError("Elige fecha y hora");
      return;
    }
    const iso = new Date(cuando).toISOString();
    if (new Date(iso) <= new Date()) {
      setError("La fecha debe ser futura");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onConfirm({ programadaPara: iso, notas: notas.trim() || null });
    } catch (err) {
      setError(err.message || "No se pudo reservar");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[900] grid place-items-end bg-volcanic/50 p-3 backdrop-blur-sm sm:place-items-center">
      <form
        onSubmit={confirmar}
        className="w-full max-w-md animate-fade-up rounded-3xl bg-cream p-5 shadow-float lg:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-extrabold tracking-tight">{titulo}</h3>
            {subtitulo && <p className="mt-0.5 text-sm text-volcanic/55">{subtitulo}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sand text-volcanic/60 hover:bg-volcanic/10"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M6 6 18 18 M18 6 6 18" />
            </svg>
          </button>
        </div>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-sm font-semibold text-volcanic/80">Fecha y hora</span>
          <input
            type="datetime-local"
            value={cuando}
            min={min}
            onChange={(e) => setCuando(e.target.value)}
            className="w-full rounded-2xl border-2 border-sand-deep bg-white px-4 py-3 text-volcanic outline-none transition-colors focus:border-taxi"
          />
        </label>

        <label className="mt-3 block">
          <span className="mb-1.5 block text-sm font-semibold text-volcanic/80">Notas (opcional)</span>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="Ej.: equipaje grande, vuelo IB3947…"
            className="w-full resize-none rounded-2xl border-2 border-sand-deep bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-taxi"
          />
        </label>

        {error && <p className="mt-3 text-sm font-semibold text-coral">{error}</p>}

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? <Spinner className="border-volcanic/30 border-t-volcanic" /> : "Confirmar reserva"}
          </Button>
        </div>
      </form>
    </div>
  );
}
