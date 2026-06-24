import { useRef, useState } from "react";

// Bottom sheet plegable sobre el mapa.
// Móvil: se agranda/encoge tirando del asa (o tocándola). Desktop: tarjeta fija.
export default function Sheet({ children, className = "" }) {
  const [expandido, setExpandido] = useState(true);
  const drag = useRef({ startY: 0, dy: 0, dragging: false });

  function onPointerDown(e) {
    drag.current = { startY: e.clientY, dy: 0, dragging: true };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e) {
    if (!drag.current.dragging) return;
    drag.current.dy = e.clientY - drag.current.startY;
  }
  function onPointerUp() {
    if (!drag.current.dragging) return;
    const dy = drag.current.dy;
    drag.current.dragging = false;
    if (dy < -40) setExpandido(true);        // tiró hacia arriba → agrandar
    else if (dy > 40) setExpandido(false);   // tiró hacia abajo → encoger
    else setExpandido((v) => !v);            // toque → alternar
  }

  return (
    <div className="absolute inset-x-0 bottom-0 z-[600] p-3 lg:left-auto lg:right-6 lg:bottom-6 lg:w-[26rem] lg:p-0">
      <div
        className={`glass animate-fade-up flex flex-col rounded-[1.6rem] shadow-float ring-1 ring-white/50 transition-[max-height] duration-300 ease-out ${className}`}
        style={{ maxHeight: expandido ? "80dvh" : "33dvh" }}
      >
        {/* asa: arrastrar o tocar para plegar/desplegar (solo móvil) */}
        <button
          type="button"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          aria-label={expandido ? "Encoger panel" : "Agrandar panel"}
          className="flex w-full shrink-0 touch-none flex-col items-center gap-1 pt-2.5 pb-1 lg:hidden"
        >
          <span className="h-1.5 w-12 rounded-full bg-volcanic/25" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-volcanic/35">
            {expandido ? "▼ Ver mapa" : "▲ Más opciones"}
          </span>
        </button>
        {/* contenido con scroll propio cuando no cabe */}
        <div className="slim-scroll flex-1 overflow-y-auto px-4 pb-4 pt-1 lg:p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
