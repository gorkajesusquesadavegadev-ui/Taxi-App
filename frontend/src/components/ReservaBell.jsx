import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { connectWs } from "../api/ws.js";
import { onToast, toast } from "../utils/toast.js";
import { fmtFechaReserva } from "../utils/reservas.js";
import { IconBell, IconCalendar } from "./icons.jsx";

const STORE = "taya:avisos";
const cargar = () => {
  try { return JSON.parse(localStorage.getItem(STORE) || "[]"); } catch { return []; }
};

/**
 * Campana de avisos del taxista, siempre visible en la barra superior.
 * Acumula los avisos de reservas (recordatorios + nuevas disponibles) y los
 * muestra en un panel. Escucha reserva:new por WebSocket en toda la app.
 */
export default function ReservaBell() {
  const [items, setItems] = useState(cargar);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const boxRef = useRef(null);

  // acumula cualquier aviso de reserva/viaje que pase por el bus de toasts
  useEffect(
    () =>
      onToast((t) => {
        if (t.tipo !== "reserva" && t.tipo !== "viaje") return;
        setItems((prev) => {
          const next = [{ id: t.id, titulo: t.titulo, cuerpo: t.cuerpo, ts: Date.now() }, ...prev].slice(0, 20);
          localStorage.setItem(STORE, JSON.stringify(next));
          return next;
        });
        setUnread((u) => u + 1);
      }),
    []
  );

  // escucha nuevas reservas disponibles en toda la app (no solo en /reservas)
  useEffect(() => {
    const ws = connectWs((event, data) => {
      if (event === "reserva:new" && data) {
        toast("Nueva reserva disponible", `${data.detalle || "Viaje"} · ${fmtFechaReserva(data.programadaPara)}`, "reserva");
      }
    });
    return () => ws.close();
  }, []);

  // cerrar al click fuera
  useEffect(() => {
    if (!open) return;
    const h = (e) => boxRef.current && !boxRef.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  function toggle() {
    setOpen((o) => !o);
    setUnread(0);
  }

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={toggle}
        aria-label="Avisos de reservas"
        className="relative grid h-11 w-11 place-items-center rounded-2xl bg-white text-volcanic shadow-card ring-1 ring-sand-deep/60 transition-transform active:scale-90"
      >
        <IconBell />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-[1.25rem] animate-pop place-items-center rounded-full bg-coral px-1 text-[11px] font-extrabold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-2 top-[4.25rem] z-[800] animate-fade-up overflow-hidden rounded-2xl bg-white shadow-float ring-1 ring-sand-deep/60 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80">
          <div className="flex items-center justify-between border-b border-sand-deep/60 px-4 py-3">
            <p className="font-display text-sm font-extrabold">Avisos de reservas</p>
            <button
              onClick={() => {
                setItems([]);
                localStorage.setItem(STORE, "[]");
              }}
              className="text-xs font-semibold text-volcanic/45 hover:text-volcanic"
            >
              Limpiar
            </button>
          </div>
          <div className="slim-scroll max-h-[55vh] overflow-y-auto sm:max-h-80">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-volcanic/45">Sin avisos por ahora.</p>
            ) : (
              items.map((a) => (
                <div key={a.id} className="flex items-start gap-2.5 border-b border-sand-deep/40 px-4 py-3 last:border-0">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-taxi/20 text-volcanic">
                    <IconCalendar width={14} height={14} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight">{a.titulo}</p>
                    {a.cuerpo && <p className="mt-0.5 text-xs leading-snug text-volcanic/55">{a.cuerpo}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => {
              setOpen(false);
              navigate("/reservas");
            }}
            className="block w-full bg-volcanic px-4 py-3 text-center text-sm font-bold text-cream transition-colors hover:bg-volcanic-800"
          >
            Ver mis reservas
          </button>
        </div>
      )}
    </div>
  );
}
