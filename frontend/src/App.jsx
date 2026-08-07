import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Spinner from "./components/Spinner.jsx";
import ConsentimientoPendiente from "./components/ConsentimientoPendiente.jsx";

// El <link rel="canonical"> del index.html apunta a la home siempre (misma
// SPA sirve todas las rutas) — Lighthouse lo marca mal en cualquier página
// que no sea "/". Solo tiene sentido indexar rutas públicas (legales); las
// protegidas (home, ajustes...) no son contenido de buscador, así que para
// esas se deja apuntando a la home en vez de a una URL que exige login.
const RUTAS_PUBLICAS = ["/", "/aviso-legal", "/privacidad", "/cookies", "/terminos"];

function useCanonical() {
  const location = useLocation();
  useEffect(() => {
    const url = RUTAS_PUBLICAS.includes(location.pathname)
      ? `https://canarycab.com${location.pathname}`
      : "https://canarycab.com/";
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = url;
  }, [location.pathname]);
}

const Auth = lazy(() => import("./pages/Auth.jsx"));
const ClienteHome = lazy(() => import("./pages/cliente/ClienteHome.jsx"));
const TaxistaHome = lazy(() => import("./pages/taxista/TaxistaHome.jsx"));
const Historial = lazy(() => import("./pages/Historial.jsx"));
const Ofertas = lazy(() => import("./pages/cliente/Ofertas.jsx"));
const Ajustes = lazy(() => import("./pages/Ajustes.jsx"));
const Estadisticas = lazy(() => import("./pages/Estadisticas.jsx"));
const Foro = lazy(() => import("./pages/Foro.jsx"));
const Reservas = lazy(() => import("./pages/Reservas.jsx"));
const TarifaActual = lazy(() => import("./pages/TarifaActual.jsx"));
const AdminPanel = lazy(() => import("./pages/admin/AdminPanel.jsx"));
const Seguir = lazy(() => import("./pages/Seguir.jsx"));
const Aviso = lazy(() => import("./pages/legal/Aviso.jsx"));
const Privacidad = lazy(() => import("./pages/legal/Privacidad.jsx"));
const Cookies = lazy(() => import("./pages/legal/Cookies.jsx"));
const Terminos = lazy(() => import("./pages/legal/Terminos.jsx"));

function Splash() {
  return (
    <div className="grid h-screen place-items-center bg-volcanic text-cream">
      <div className="flex flex-col items-center gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-3xl bg-taxi text-volcanic font-display text-3xl font-extrabold">
          T
        </span>
        <Spinner />
      </div>
    </div>
  );
}

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user, loading, setUser, logout } = useAuth();
  const location = useLocation();
  useCanonical();
  if (loading) return <Splash />;

  // Cuentas creadas antes de que el registro tuviera casilla de aceptacion: no
  // hay constancia de su consentimiento (art. 7.1 RGPD), asi que se pide antes
  // de dejar seguir usando la app.
  if (user?.requiereConsentimiento) {
    return (
      <ConsentimientoPendiente
        onAceptado={() => setUser((u) => ({ ...u, requiereConsentimiento: false }))}
        onSalir={logout}
      />
    );
  }

  return (
    <Suspense fallback={<Splash />}>
      <div key={location.pathname} className="page-fade h-full">
      <Routes location={location}>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Auth />} />
        <Route
          path="/"
          element={
            <Protected>
              {user?.rol === "ADMIN" ? (
                <Navigate to="/admin" replace />
              ) : user?.rol === "TAXISTA" ? (
                <TaxistaHome />
              ) : (
                <ClienteHome />
              )}
            </Protected>
          }
        />
        <Route
          path="/admin"
          element={
            <Protected>
              {user?.rol === "ADMIN" ? <AdminPanel /> : <Navigate to="/" replace />}
            </Protected>
          }
        />
        <Route path="/historial" element={<Protected><Historial /></Protected>} />
        <Route
          path="/transfers"
          element={
            <Protected>
              {user?.rol === "TAXISTA" ? <Navigate to="/" replace /> : <Ofertas tipo="transfers" />}
            </Protected>
          }
        />
        <Route
          path="/excursiones"
          element={
            <Protected>
              {user?.rol === "TAXISTA" ? <Navigate to="/" replace /> : <Ofertas tipo="excursiones" />}
            </Protected>
          }
        />
        <Route path="/ajustes" element={<Protected><Ajustes /></Protected>} />
        <Route path="/estadisticas" element={<Protected><Estadisticas /></Protected>} />
        <Route path="/reservas" element={<Protected><Reservas /></Protected>} />
        <Route path="/tarifa" element={<Protected><TarifaActual /></Protected>} />
        <Route
          path="/foro"
          element={
            <Protected>
              {user?.rol === "TAXISTA" ? <Foro /> : <Navigate to="/" replace />}
            </Protected>
          }
        />
        <Route path="/seguir/:token" element={<Seguir />} />
        <Route path="/aviso-legal" element={<Aviso />} />
        <Route path="/privacidad" element={<Privacidad />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route path="/terminos" element={<Terminos />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </div>
    </Suspense>
  );
}
