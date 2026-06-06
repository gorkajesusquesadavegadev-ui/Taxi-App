import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import Card from "../components/Card.jsx";
import Badge from "../components/Badge.jsx";
import Spinner from "../components/Spinner.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";

const fmtEur = (v) => (v == null ? "—" : `${Number(v).toFixed(2)} €`);

export default function Historial() {
  const { user } = useAuth();
  const esTaxista = user?.rol === "TAXISTA";
  const [viajes, setViajes] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetcher = esTaxista ? api.historialTaxista : api.historialCliente;
    fetcher()
      .then(setViajes)
      .catch((e) => setError(e.message || "No se pudo cargar"));
  }, [esTaxista]);

  return (
    <Layout title={esTaxista ? "Mis carreras" : "Mis viajes"}>
      <div className="h-full overflow-y-auto no-scrollbar px-4 py-4">
        {!viajes && !error && (
          <div className="grid place-items-center py-16">
            <Spinner />
          </div>
        )}
        {error && <p className="rounded-2xl bg-coral/12 p-4 text-sm text-coral">{error}</p>}
        {viajes && viajes.length === 0 && (
          <div className="grid place-items-center py-16 text-center">
            <span className="mb-3 text-4xl">🗺️</span>
            <p className="font-display text-lg font-bold">Sin viajes todavía</p>
            <p className="text-sm text-volcanic/55">
              {esTaxista ? "Conéctate para recibir carreras." : "Pide tu primer taxi."}
            </p>
          </div>
        )}
        <div className="space-y-3">
          {viajes?.map((v, i) => (
            <Card
              key={v.id}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display font-bold">Viaje #{v.id}</p>
                  <p className="mt-0.5 text-sm text-volcanic/55">
                    {Number(v.distanciaRealKm ?? v.distanciaEstimadaKm ?? 0).toFixed(1)} km
                  </p>
                </div>
                <Badge estado={v.estado} />
              </div>
              <div className="mt-3 flex items-end justify-between border-t border-sand-deep/70 pt-3">
                <span className="text-xs uppercase tracking-wider text-volcanic/45">
                  {v.precioFinal != null ? "Precio final" : "Estimado"}
                </span>
                <span className="font-display text-xl font-extrabold">
                  {fmtEur(v.precioFinal ?? v.precioEstimado)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
