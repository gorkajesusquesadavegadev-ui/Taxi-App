import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { IconPin, IconCar, IconList, IconClose, IconLogout } from "./icons.jsx";

const NAV = {
  CLIENTE: [
    { to: "/", label: "Pedir taxi", icon: IconPin, end: true },
    { to: "/historial", label: "Mis viajes", icon: IconList },
  ],
  TAXISTA: [
    { to: "/", label: "Conducir", icon: IconCar, end: true },
    { to: "/historial", label: "Mis carreras", icon: IconList },
  ],
};

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const items = NAV[user?.rol] || [];

  return (
    <>
      {/* overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-volcanic/60 backdrop-blur-sm transition-opacity duration-300
          ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      {/* drawer */}
      <aside
        className={`grain fixed inset-y-0 left-0 z-50 flex w-[78%] max-w-[19rem] flex-col
          bg-volcanic text-cream shadow-drawer transition-transform duration-300 ease-out
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* warm glow top-right */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-taxi/20 blur-3xl" />
        {/* header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-taxi text-volcanic font-display text-xl font-extrabold">
              T
            </span>
            <div className="leading-tight">
              <p className="font-display text-xl font-extrabold tracking-tight">TAYA</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-taxi-soft/80">
                Taxi · Canarias
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl text-cream/70 hover:bg-volcanic-700"
            aria-label="Cerrar menú"
          >
            <IconClose />
          </button>
        </div>

        {/* user card */}
        <div className="mx-4 mb-2 rounded-2xl bg-volcanic-800 p-4">
          <p className="text-xs uppercase tracking-wider text-taxi-soft/70">
            {user?.rol === "TAXISTA" ? "Taxista" : "Cliente"}
          </p>
          <p className="mt-0.5 truncate font-display text-lg font-bold">
            {user?.nombre || "—"}
          </p>
          <p className="truncate text-sm text-cream/55">{user?.email}</p>
          {user?.vehiculoMatricula && (
            <p className="mt-2 inline-flex rounded-lg bg-taxi/15 px-2 py-1 text-xs font-semibold text-taxi-soft">
              {user.vehiculoModelo} · {user.vehiculoMatricula}
            </p>
          )}
        </div>

        {/* nav */}
        <nav className="relative mt-2 flex-1 space-y-1 px-3">
          {items.map(({ to, label, icon: Icon, end }, i) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              style={open ? { animationDelay: `${120 + i * 60}ms` } : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold transition-all
                ${open ? "animate-fade-up" : ""}
                ${
                  isActive
                    ? "bg-taxi text-volcanic shadow-[0_8px_20px_-8px_rgba(255,196,0,0.7)]"
                    : "text-cream/75 hover:bg-volcanic-700 hover:text-cream"
                }`
              }
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* footer */}
        <div className="px-3 pb-6">
          <button
            onClick={() => {
              onClose?.();
              logout();
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-semibold
              text-coral/90 transition-colors hover:bg-coral/15"
          >
            <IconLogout />
            Cerrar sesión
          </button>
          <p className="mt-3 px-4 text-[11px] text-cream/30">TAYA MVP · v0.1</p>
        </div>
      </aside>
    </>
  );
}
