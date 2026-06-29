import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const SLIDES_CLIENTE = [
  { emoji: "📍", titulo: "Pide en segundos", texto: "Tu ubicación, destino y listo. Ves los taxis libres cerca en el mapa en vivo." },
  { emoji: "🚕", titulo: "Sigue tu taxi", texto: "Cuando aceptan, ves al taxi acercarse con su ETA, matrícula y valoración. Compártelo con quien quieras." },
  { emoji: "⭐", titulo: "Favoritos y más", texto: "Guarda Casa y Trabajo, descarga recibos, gana viajes con fidelidad y pide taxi adaptado si lo necesitas." },
];
const SLIDES_TAXISTA = [
  { emoji: "🟢", titulo: "Conéctate", texto: "Pulsa Conectar y empieza a recibir solicitudes de viaje cercanas al instante." },
  { emoji: "🔔", titulo: "Avisos aunque esté cerrada", texto: "Activa las notificaciones: te llegan las carreras aunque tengas la app cerrada." },
  { emoji: "🗺️", titulo: "Mapa de demanda", texto: "Mira las zonas calientes para colocarte donde hay más clientes." },
];

export default function Onboarding() {
  const { user } = useAuth();
  const visto = typeof localStorage !== "undefined" && localStorage.getItem("taya:onboarded") === "1";
  const [abierto, setAbierto] = useState(!visto);
  const [i, setI] = useState(0);

  if (!abierto || !user) return null;
  const slides = user.rol === "TAXISTA" ? SLIDES_TAXISTA : SLIDES_CLIENTE;
  const s = slides[i];
  const ultimo = i === slides.length - 1;

  function cerrar() {
    try { localStorage.setItem("taya:onboarded", "1"); } catch { /* ignore */ }
    setAbierto(false);
  }

  return (
    <div className="fixed inset-0 z-[3000] grid place-items-center bg-volcanic/70 p-5 backdrop-blur-sm">
      <div className="w-full max-w-sm animate-fade-up rounded-3xl bg-cream p-6 text-center shadow-float">
        <button onClick={cerrar} className="ml-auto block text-sm font-bold text-volcanic/40 hover:text-volcanic">
          Saltar
        </button>
        <div className="mt-2 grid h-24 place-items-center text-6xl">{s.emoji}</div>
        <h2 className="mt-3 font-display text-xl font-black text-volcanic">{s.titulo}</h2>
        <p className="mt-2 text-sm leading-relaxed text-volcanic/65">{s.texto}</p>

        <div className="mt-5 flex items-center justify-center gap-1.5">
          {slides.map((_, j) => (
            <span key={j} className={`h-2 rounded-full transition-all ${j === i ? "w-6 bg-taxi" : "w-2 bg-volcanic/20"}`} />
          ))}
        </div>

        <button
          onClick={() => (ultimo ? cerrar() : setI((v) => v + 1))}
          className="mt-5 w-full rounded-2xl bg-taxi py-3 font-display text-base font-extrabold text-volcanic transition active:scale-95"
        >
          {ultimo ? "¡Empezar!" : "Siguiente"}
        </button>
      </div>
    </div>
  );
}
