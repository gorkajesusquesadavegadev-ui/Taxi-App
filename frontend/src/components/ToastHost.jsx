import { useEffect, useState } from "react";
import { onToast } from "../utils/toast.js";
import { IconCalendar, IconCar, IconBolt } from "./icons.jsx";

const ICONO = { reserva: IconCalendar, viaje: IconCar, info: IconBolt };

function Toast({ t, onClose }) {
  const Icon = ICONO[t.tipo] || IconBolt;
  useEffect(() => {
    const id = setTimeout(onClose, 6000);
    return () => clearTimeout(id);
  }, [onClose]);
  return (
    <div
      onClick={onClose}
      className="pointer-events-auto flex w-full max-w-sm cursor-pointer items-start gap-3 rounded-2xl bg-volcanic px-4 py-3 text-cream shadow-float ring-1 ring-white/10"
      style={{ animation: "toast-in 0.35s cubic-bezier(0.22,1.2,0.36,1) both" }}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-taxi text-volcanic">
        <Icon width={18} height={18} />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="font-display text-sm font-extrabold leading-tight">{t.titulo}</p>
        {t.cuerpo && <p className="mt-0.5 text-xs leading-snug text-cream/70">{t.cuerpo}</p>}
      </div>
    </div>
  );
}

// Pila de toasts arriba-centro, por encima de todo.
export default function ToastHost() {
  const [items, setItems] = useState([]);
  useEffect(
    () =>
      onToast((t) => {
        setItems((prev) => [...prev, t].slice(-3));
      }),
    []
  );
  const cerrar = (id) => setItems((prev) => prev.filter((t) => t.id !== id));
  if (items.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[1000] flex flex-col items-center gap-2 px-3">
      {items.map((t) => (
        <Toast key={t.id} t={t} onClose={() => cerrar(t.id)} />
      ))}
    </div>
  );
}
