import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  IconPin,
  IconCar,
  IconList,
  IconClose,
  IconLogout,
  IconGear,
  IconPlane,
  IconCompass,
} from "./icons.jsx";

const NAV = {
  CLIENTE: [
    { to: "/", label: "Pedir taxi", icon: IconPin, end: true },
    { to: "/transfers", label: "Transfers", icon: IconPlane },
    { to: "/excursiones", label: "Excursiones", icon: IconCompass },
    { to: "/historial", label: "Mis viajes", icon: IconList },
  ],
  TAXISTA: [
    { to: "/", label: "Conducir", icon: IconCar, end: true },
    { to: "/historial", label: "Mis carreras", icon: IconList },
  ],
};

// Drawer on mobile; permanently docked navigation rail on lg+.
export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const items = NAV[user?.rol] || [];

  return (
    <>
      {/* overlay (mobile only) */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-volcanic/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden
          ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      {/* drawer / rail */}
      <aside
        className={`grain fixed inset-y-0 left-0 z-50 flex w-[78%] max-w-[19rem] flex-col
          bg-volcanic text-cream shadow-drawer transition-transform duration-300 ease-out
          lg:static lg:z-auto lg:w-[17.5rem] lg:max-w-none lg:translate-x-0 lg:shadow-none
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* warm glow top-right */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 animate-sun-drift rounded-full bg-taxi/20 blur-3xl" />
        {/* atlantic glow bottom */}
        <div className="pointer-events-none absolute -bottom-16 -left-12 h-48 w-48 rounded-full bg-atlantic/25 blur-3xl" />

        {/* header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-taxi font-display text-lg font-extrabold text-volcanic shadow-sun">
              T
            </span>
            <div className="leading-tight">
              <p className="font-display text-lg font-extrabold tracking-tight">TAYA</p>
              <p className="text-[10px] uppercase tracking-[0.24em] text-taxi-soft/80">
                Taxi · Canarias
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl text-cream/70 hover:bg-volcanic-700 lg:hidden"
            aria-label="Cerrar menú"
          >
            <IconClose />
          </button>
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

        {/* footer: cerrar sesión + ajustes */}
        <div className="relative px-3 pb-6">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                onClose?.();
                logout();
              }}
              className="flex flex-1 items-center gap-3 rounded-2xl px-4 py-3 font-semibold
                text-cream/60 transition-colors hover:bg-volcanic-700 hover:text-cream"
            >
              <IconLogout />
              Cerrar sesión
            </button>
            <NavLink
              to="/ajustes"
              onClick={onClose}
              aria-label="Ajustes"
              className={({ isActive }) =>
                `grid h-11 w-11 shrink-0 place-items-center rounded-2xl transition-colors ${
                  isActive
                    ? "bg-taxi text-volcanic"
                    : "text-cream/60 hover:bg-volcanic-700 hover:text-cream"
                }`
              }
            >
              <IconGear />
            </NavLink>
          </div>
          <p className="mt-3 px-4 text-[11px] text-cream/30">TAYA MVP · v0.1</p>
        </div>
      </aside>
    </>
  );
}
