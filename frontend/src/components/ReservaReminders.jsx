import { useEffect } from "react";
import { api } from "../api/client.js";
import { toast } from "../utils/toast.js";
import { fmtFechaReserva } from "../utils/reservas.js";

// Marca un aviso como ya mostrado (persistente por navegador).
const yaAvisado = (k) => localStorage.getItem(k) === "1";
const marcar = (k) => localStorage.setItem(k, "1");

/**
 * Recordatorios de reservas del taxista. Cada minuto revisa sus reservas
 * aceptadas y avisa una sola vez: con un día de antelación y de nuevo cuando
 * falta menos de una hora. Montado de forma invisible para el taxista.
 */
export default function ReservaReminders() {
  useEffect(() => {
    let alive = true;
    const revisar = async () => {
      let reservas;
      try {
        reservas = await api.reservasTaxista();
      } catch {
        return;
      }
      if (!alive) return;
      const ahora = Date.now();
      for (const r of reservas) {
        if (r.estado !== "ACEPTADA") continue;
        const t = new Date(r.programadaPara).getTime();
        const min = (t - ahora) / 60000;
        const lugar = r.origenTexto || "el punto marcado";
        if (min <= 60 && min > 0 && !yaAvisado(`taya:rem:${r.id}:1h`)) {
          marcar(`taya:rem:${r.id}:1h`);
          toast("Reserva en menos de 1 h", `${r.detalle || "Viaje"} · recoges en ${lugar}`, "reserva");
        } else if (min <= 1440 && min > 60 && !yaAvisado(`taya:rem:${r.id}:dia`)) {
          marcar(`taya:rem:${r.id}:dia`);
          toast("Tienes una reserva próxima", `${fmtFechaReserva(r.programadaPara)} · recoges en ${lugar}`, "reserva");
        }
      }
    };
    revisar();
    const id = setInterval(revisar, 60000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);
  return null;
}
