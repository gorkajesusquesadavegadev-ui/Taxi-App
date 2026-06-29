import { useEffect, useState } from "react";

/**
 * Banner sutil de estado de conexión. Aparece si el dispositivo se queda sin
 * red y confirma brevemente al recuperarla. Señal de fiabilidad (premium).
 */
export default function ConexionBanner() {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [reapareceOk, setReapareceOk] = useState(false);

  useEffect(() => {
    const irOffline = () => { setOnline(false); setReapareceOk(false); };
    const irOnline = () => {
      setOnline(true);
      setReapareceOk(true);
      setTimeout(() => setReapareceOk(false), 2500);
    };
    window.addEventListener("offline", irOffline);
    window.addEventListener("online", irOnline);
    return () => {
      window.removeEventListener("offline", irOffline);
      window.removeEventListener("online", irOnline);
    };
  }, []);

  if (online && !reapareceOk) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[2000] flex justify-center p-2" style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}>
      <div
        className={`animate-fade-up rounded-full px-4 py-1.5 text-xs font-bold shadow-float ${
          online ? "bg-palm text-white" : "bg-volcanic text-cream"
        }`}
        role="status"
        aria-live="polite"
      >
        {online ? "✓ Conexión recuperada" : "Sin conexión · reintentando…"}
      </div>
    </div>
  );
}
