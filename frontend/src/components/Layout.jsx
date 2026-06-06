import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "./Sidebar.jsx";
import { IconMenu } from "./icons.jsx";

export default function Layout({ title, action, children }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    // On desktop, present the app inside a centered phone-sized column over a textured backdrop.
    <div className="min-h-screen w-full bg-volcanic md:py-6">
      <div
        className="relative mx-auto flex h-screen w-full max-w-md flex-col overflow-hidden bg-cream
          md:h-[min(880px,calc(100vh-3rem))] md:rounded-[2rem] md:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] md:ring-1 md:ring-black/20"
      >
        <Sidebar open={open} onClose={() => setOpen(false)} />

        {/* top bar */}
        <header className="z-30 flex items-center gap-3 border-b border-sand-deep/70 bg-cream/85 px-3 py-3 backdrop-blur">
          <button
            onClick={() => setOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-2xl bg-volcanic text-cream active:scale-95"
            aria-label="Abrir menú"
          >
            <IconMenu />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-lg font-extrabold leading-tight">
              {title}
            </h1>
            <p className="text-[11px] uppercase tracking-[0.18em] text-volcanic/45">
              {user?.rol === "TAXISTA" ? "Modo taxista" : "Modo cliente"}
            </p>
          </div>
          {action}
        </header>

        {/* content */}
        <main className="relative flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
