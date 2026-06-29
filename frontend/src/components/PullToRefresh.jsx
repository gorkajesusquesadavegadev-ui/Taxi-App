import { useRef, useState } from "react";
import Spinner from "./Spinner.jsx";
import { tapLigero } from "../utils/haptics.js";

/**
 * Contenedor con "tirar para refrescar" (móvil). Solo activa cuando el scroll
 * está arriba del todo y se arrastra hacia abajo. onRefresh: async.
 */
export default function PullToRefresh({ onRefresh, children, className = "" }) {
  const ref = useRef(null);
  const startY = useRef(0);
  const pulling = useRef(false);
  const [dist, setDist] = useState(0);
  const [refrescando, setRefrescando] = useState(false);
  const UMBRAL = 70;

  function onTouchStart(e) {
    if (refrescando) return;
    if ((ref.current?.scrollTop ?? 0) <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }
  function onTouchMove(e) {
    if (!pulling.current || refrescando) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) {
      // resistencia: cuesta más cuanto más tiras
      setDist(Math.min(dy * 0.5, UMBRAL + 20));
    }
  }
  async function onTouchEnd() {
    if (!pulling.current) return;
    pulling.current = false;
    if (dist >= UMBRAL) {
      setRefrescando(true);
      tapLigero();
      try { await onRefresh?.(); } catch { /* ignore */ }
      setRefrescando(false);
    }
    setDist(0);
  }

  return (
    <div
      ref={ref}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={`slim-scroll relative h-full overflow-y-auto overflow-x-hidden ${className}`}
    >
      {/* indicador */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center"
        style={{ height: dist, opacity: refrescando ? 1 : Math.min(dist / UMBRAL, 1) }}
      >
        <div className="mt-2 grid h-8 w-8 place-items-center rounded-full bg-white shadow-card">
          {refrescando ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <span
              className="text-volcanic/60 transition-transform"
              style={{ transform: `rotate(${Math.min(dist / UMBRAL, 1) * 180}deg)` }}
            >
              ↓
            </span>
          )}
        </div>
      </div>
      <div style={{ transform: `translateY(${refrescando ? 36 : dist}px)`, transition: pulling.current ? "none" : "transform 0.25s ease" }}>
        {children}
      </div>
    </div>
  );
}
