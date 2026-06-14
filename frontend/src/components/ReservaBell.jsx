import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { connectWs } from "../api/ws.js";
import { onToast, toast } from "../utils/toast.js";
import { fmtFechaReserva } from "../utils/reservas.js";
import { IconBell, IconCalendar } from "./icons.jsx";

const STORE = "taya:avisos";
const cargar = () => {
  try { return JSON.parse(localStorage.getItem(STORE) || "[]"); } catch { return []; }
};
const guardar = (items) => localStorage.setItem(STORE, JSON.stringify(items));

// chip de estado por aviso
const ESTADO = {
  abierta: { txt: "Disponible", cls: "bg-taxi/25 text-volcanic" },
  tuya: { txt: "Es tuya", cls: "bg-atlantic/15 text-atlantic-dark" },
  tomada: { txt: "Ya tomada", cls: "bg-volcanic/10 text-volcanic/50" },
  caducada: { txt: "Ha caducado", cls: "bg-coral/15 text-coral" },
};

/**
 * Campana de avisos del taxista, siempre visible. Cada aviso de reserva queda
 * guardado y se actualiza en vivo: si otro taxista la coge pasa a "Ya tomada"
 * y si vence sin aceptarse a "Ha caducado". Escucha reserva:* en toda la app.
 */
export default function ReservaBell() {
  const { user } = useAuth();
  const [items, setItems] = useState(cargar);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const boxRef = useRef(null);

  // actualiza el estado de un aviso por reservaId (tomada/caducada/tuya)
  function marcar(reservaId, estado) {
    setItems((prev) => {
      const next = prev.map((a) =>
        a.reservaId === reservaId && a.estado !== "tuya" ? { ...a, estado } : a
      );
      guardar(next);
      return next;
    });
  }

  // acumula avisos de reservas/viajes que pasen por el bus de toasts
  useEffect(
    () =>
      onToast((t) => {
        if (t.tipo !== "reserva" && t.tipo !== "viaje") return;
        setItems((prev) => {
          const aviso = {
            id: t.id,
            titulo: t.titulo,
            cuerpo: t.cuerpo,
            ts: Date.now(),
            reservaId: t.meta?.reservaId ?? null,
            estado: t.meta?.estado ?? null,
          };
          const next = [aviso, ...prev].slice(0, 25);
          guardar(next);
          return next;
        });
        setUnread((u) => u + 1);
      }),
    []
  );

  // eventos de reserva en toda la app (no solo en /reservas)
  useEffect(() => {
    const ws = connectWs((event, data) => {
      if (!data) return;
      if (event === "reserva:new") {
        toast("Nueva reserva disponible", `${data.detalle || "Viaje"} · ${fmtFechaReserva(data.programadaPara)}`,
          "reserva", { reservaId: data.id, estado: "abierta" });
      }
      if (event === "reserva:taken") {
        // si la cogí yo, es mía; si la cogió otro, ya no está disponible
        marcar(data.id, Number(data.taxistaId) === Number(user?.id) ? "tuya" : "tomada");
      }
      if (event === "reserva:expired") marcar(data.id, "caducada");
    });
    return () => ws.close();
  }, [user?.id]);

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

  function abrirReserva(a) {
    setOpen(false);
    navigate("/reservas");
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
                guardar([]);
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
              items.map((a) => {
                const est = a.estado ? ESTADO[a.estado] : null;
                const clicable = a.reservaId != null;
                return (
                  <button
                    key={a.id}
                    onClick={() => clicable && abrirReserva(a)}
                    className={`flex w-full items-start gap-2.5 border-b border-sand-deep/40 px-4 py-3 text-left last:border-0 ${
                      clicable ? "hover:bg-sand" : "cursor-default"
                    }`}
                  >
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-taxi/20 text-volcanic">
                      <IconCalendar width={14} height={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-tight">{a.titulo}</p>
                      {a.cuerpo && <p className="mt-0.5 text-xs leading-snug text-volcanic/55">{a.cuerpo}</p>}
                      {est && <span className={`pill mt-1.5 ${est.cls}`}>{est.txt}</span>}
                    </div>
                  </button>
                );
              })
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
