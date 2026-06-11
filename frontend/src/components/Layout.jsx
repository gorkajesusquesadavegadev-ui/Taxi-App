import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "./Sidebar.jsx";
import { IconMenu } from "./icons.jsx";

export default function Layout({ title, action, children, framed = false }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    // Full-bleed responsive shell: drawer sidebar on mobile, docked rail on lg+.
    <div className="relative flex h-screen w-full overflow-hidden bg-cream">
      <Sidebar open={open} onClose={() => setOpen(false)} />

      <div className="grain mesh-warm relative flex min-w-0 flex-1 flex-col">
        {/* top bar */}
        <header className="glass relative z-30 flex items-center gap-3 border-b border-sand-deep/60 px-3 py-3 lg:px-6">
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
          {action}
        </header>

        {/* content */}
        <main className={`relative z-10 flex-1 overflow-hidden ${framed ? "map-vignette" : ""}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
