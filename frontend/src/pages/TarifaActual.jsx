import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import Spinner from "../components/Spinner.jsx";
import { IconPin, IconCompass, IconPlane } from "../components/icons.jsx";
import { api } from "../api/client.js";

const eur = (v) => `${Number(v).toFixed(2)} €`;

function ZonaCard({ icon: Icon, titulo, sub, precio, destacado }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 ring-1 ${
        destacado
          ? "bg-volcanic text-cream ring-white/10"
          : "bg-white text-volcanic ring-sand-deep/60"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
            destacado ? "bg-taxi text-volcanic" : "bg-atlantic/12 text-atlantic-dark"
          }`}
        >
          <Icon width={20} height={20} />
        </span>
        <div className="min-w-0">
          <p className="font-display text-sm font-extrabold leading-tight">{titulo}</p>
          <p className={`text-xs ${destacado ? "text-cream/60" : "text-volcanic/50"}`}>{sub}</p>
        </div>
      </div>
      <p className="mt-3 font-display text-2xl font-extrabold">
        {eur(precio)}
        <span className={`ml-1 text-sm font-medium ${destacado ? "text-cream/55" : "text-volcanic/45"}`}>
          /km
        </span>
      </p>
    </div>
  );
}

export default function TarifaActual() {
  const [t, setT] = useState(null);
  const [error, setError] = useState("");

  const cargar = () =>
    api
      .tarifaActual()
      .then(setT)
      .catch((e) => setError(e.message || "No se pudo cargar la tarifa"));

  useEffect(() => {
    cargar();
    const id = setInterval(cargar, 60000); // refresco para reflejar cambios de franja
    return () => clearInterval(id);
  }, []);

  return (
    <Layout title="Tarifa actual" framed>
      <div className="h-full overflow-y-auto overflow-x-hidden slim-scroll">
        <div className="mx-auto max-w-2xl space-y-4 p-4 lg:p-6">
          {error && <p className="rounded-2xl bg-coral/12 p-4 text-sm text-coral">{error}</p>}
          {!t && !error && (
            <div className="grid place-items-center py-16">
              <Spinner />
            </div>
          )}
          {t && (
            <>
              {/* cabecera: franja vigente, estética postal canaria */}
              <header className="auth-sky relative overflow-hidden rounded-3xl p-5 text-volcanic shadow-card">
                <div className="auth-sun absolute -right-6 -top-6 h-24 w-24 opacity-90" />
                <div className="grain absolute inset-0" />
                <div className="relative">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-volcanic/60">
                    Taxi · Las Palmas de Gran Canaria
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight drop-shadow-sm">
                    Tarifa {t.franja}
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="pill bg-volcanic text-cream">
                      Bajada de bandera {eur(t.bajadaBandera)}
                    </span>
                    <span className="pill bg-white/80 text-volcanic">
                      Incluye {t.metrosIncluidos} m
                    </span>
                    {t.esFestivo && <span className="pill bg-taxi text-volcanic">Festivo</span>}
                  </div>
                </div>
              </header>

              {/* precio por km según zona */}
              <div>
                <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-volcanic/45">
                  Precio por kilómetro
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <ZonaCard icon={IconPin} titulo="Urbano" sub="Casco de Las Palmas" precio={t.kmUrbano} />
                  <ZonaCard
                    icon={IconCompass}
                    titulo="Tarifa 3"
                    sub="Barrios periféricos"
                    precio={t.kmTarifa3}
                  />
                  <ZonaCard
                    icon={IconPlane}
                    titulo="Interurbano"
                    sub="Aeropuerto, sur, norte…"
                    precio={t.kmInterurbano}
                    destacado
                  />
                </div>
              </div>

              {/* nota */}
              <div className="surface p-4 text-sm leading-relaxed text-volcanic/65">
                <p className="font-semibold text-volcanic">¿Cómo se calcula?</p>
                <p className="mt-1">
                  La bajada de bandera incluye los primeros {t.metrosIncluidos} m. A partir de ahí se
                  suma el precio por km de la zona. La franja ({t.franja.toLowerCase()}) se actualiza
                  sola según la hora, el día y los festivos del calendario oficial.
                </p>
                <p className="mt-2 text-xs text-volcanic/45">
                  Tarifas oficiales del taxi de Las Palmas de Gran Canaria (BOC nº 150, 2023).
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
