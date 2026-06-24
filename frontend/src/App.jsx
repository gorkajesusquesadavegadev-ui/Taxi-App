import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Spinner from "./components/Spinner.jsx";

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
  const { user, loading } = useAuth();
  if (loading) return <Splash />;

  return (
    <Suspense fallback={<Splash />}>
      <Routes>
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
        <Route path="/privacidad" element={<Privacidad />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route path="/terminos" element={<Terminos />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
