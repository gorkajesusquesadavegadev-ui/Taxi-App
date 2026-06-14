import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Spinner from "./components/Spinner.jsx";
import Auth from "./pages/Auth.jsx";
import ClienteHome from "./pages/cliente/ClienteHome.jsx";
import TaxistaHome from "./pages/taxista/TaxistaHome.jsx";
import Historial from "./pages/Historial.jsx";
import Ofertas from "./pages/cliente/Ofertas.jsx";
import Ajustes from "./pages/Ajustes.jsx";
import Estadisticas from "./pages/Estadisticas.jsx";
import Foro from "./pages/Foro.jsx";
import Reservas from "./pages/Reservas.jsx";
import TarifaActual from "./pages/TarifaActual.jsx";

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
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Auth />} />
      <Route
        path="/"
        element={
          <Protected>{user?.rol === "TAXISTA" ? <TaxistaHome /> : <ClienteHome />}</Protected>
        }
      />
      <Route
        path="/historial"
        element={
          <Protected>
            <Historial />
          </Protected>
        }
      />
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
      <Route
        path="/ajustes"
        element={
          <Protected>
            <Ajustes />
          </Protected>
        }
      />
      <Route
        path="/estadisticas"
        element={
          <Protected>
            <Estadisticas />
          </Protected>
        }
      />
      <Route
        path="/reservas"
        element={
          <Protected>
            <Reservas />
          </Protected>
        }
      />
      <Route
        path="/tarifa"
        element={
          <Protected>
            <TarifaActual />
          </Protected>
        }
      />
      <Route
        path="/foro"
        element={
          <Protected>
            {user?.rol === "TAXISTA" ? <Foro /> : <Navigate to="/" replace />}
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
