import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "./Sidebar.jsx";
import ToastHost from "./ToastHost.jsx";
import ConexionBanner from "./ConexionBanner.jsx";
import ReservaReminders from "./ReservaReminders.jsx";
import ReservaBell from "./ReservaBell.jsx";
import { IconMenu } from "./icons.jsx";

export default function Layout({ title, action, children, framed = false }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    // Full-bleed responsive shell: drawer sidebar on mobile, docked rail on lg+.
    // h-[100dvh]: la altura dinámica evita que la barra del navegador móvil
    // tape el header al hacer scroll (100vh no se ajusta a la barra).
    <div className="relative flex h-[100dvh] w-full overflow-hidden bg-cream">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-xl focus:bg-taxi focus:px-4 focus:py-2 focus:font-bold focus:text-volcanic focus:shadow-float">
        Saltar al contenido
      </a>
      <ToastHost />
      <ConexionBanner />
      {user?.rol === "TAXISTA" && <ReservaReminders />}
      <Sidebar open={open} onClose={() => setOpen(false)} />

      <div className="grain mesh-warm relative flex min-w-0 flex-1 flex-col">
        {/* top bar — sticky: siempre visible aunque el contenido haga scroll */}
        <header
          className="glass sticky top-0 z-[1001] flex shrink-0 items-center gap-3 border-b border-sand-deep/60 px-3 py-3 lg:px-6"
          style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
        >
          <button
            onClick={() => setOpen(true)}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-volcanic text-cream shadow-card transition-transform active:scale-90 lg:hidden"
            aria-label="Abrir menú"
          >
            <IconMenu />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-base font-bold leading-tight lg:text-lg">
              {title}
            </h1>
            <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-volcanic/45">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-taxi" />
              {user?.rol === "TAXISTA" ? "Modo taxista" : "Modo cliente"}
            </p>
          </div>
          {user?.rol === "TAXISTA" && <ReservaBell />}
          {action}
        </header>

        {/* content */}
        <main id="main-content" className={`relative isolate flex-1 overflow-hidden ${framed ? "map-vignette" : ""}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
