import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import Spinner from "../components/Spinner.jsx";
import { IconPin, IconPlane } from "../components/icons.jsx";
import { api } from "../api/client.js";
import { useI18n } from "../i18n/index.jsx";

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
  const { t: tr } = useI18n();
  const [t, setT] = useState(null);
  const [error, setError] = useState("");

  const cargar = () =>
    api
      .tarifaActual()
      .then(setT)
      .catch((e) => setError(e.message || tr("fare.couldNotLoad")));

  useEffect(() => {
    cargar();
    const id = setInterval(cargar, 60000); // refresco para reflejar cambios de franja
    return () => clearInterval(id);
  }, []);

  return (
    <Layout title={tr("fare.title")} framed>
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
                    {tr("fare.taxiGc")}
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight drop-shadow-sm">
                    {tr("fare.farePrefix")} {t.franja}
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="pill bg-volcanic text-cream">
                      {tr("fare.flagDrop")} {eur(t.bajadaBandera)}
                    </span>
                    <span className="pill bg-white/80 text-volcanic">
                      {tr("fare.includes")} {t.metrosIncluidosUrbano} m
                    </span>
                    {t.esFestivo && <span className="pill bg-taxi text-volcanic">{tr("fare.holiday")}</span>}
                  </div>
                </div>
              </header>

              {/* precio por km según zona */}
              <div>
                <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-volcanic/45">
                  {tr("fare.pricePerKm")}
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ZonaCard icon={IconPin} titulo={tr("fare.urban")} sub={tr("fare.urbanSub")} precio={t.kmUrbano} />
                  <ZonaCard
                    icon={IconPlane}
                    titulo={tr("fare.interurban")}
                    sub={tr("fare.interurbanSub")}
                    precio={t.kmT3}
                    destacado
                  />
                </div>
              </div>

              {/* interurbano: mínimo + suplementos, estructura distinta a la urbana */}
              <div className="surface p-4 text-sm leading-relaxed text-volcanic/65">
                <p className="font-semibold text-volcanic">{tr("fare.t3Title")}</p>
                <p className="mt-1">
                  {tr("fare.t3Body", { minimo: eur(t.minimoPercepcionT3), m: t.metrosIncluidosT3 })}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="pill bg-atlantic/10 text-atlantic-dark">
                    {tr("fare.supRadiotaxi")} {eur(t.suplementoRadiotaxi)}
                  </span>
                  <span className="pill bg-atlantic/10 text-atlantic-dark">
                    {tr("fare.supAirport")} {eur(t.suplementoAeropuertoPuerto)}
                  </span>
                </div>
              </div>

              {/* qué tarifa se aplica según el municipio de origen del viaje */}
              <div className="surface p-4 text-sm leading-relaxed text-volcanic/70">
                <p className="font-semibold text-volcanic">{tr("fare.byTownTitle")}</p>
                <p className="mt-1 text-volcanic/60">{tr("fare.byTownIntro")}</p>
                <ul className="mt-3 space-y-2.5">
                  <li className="flex gap-2.5">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-atlantic" aria-hidden="true" />
                    <span>
                      <strong className="font-bold text-volcanic">{tr("fare.townLpgc")}</strong>{" "}
                      {tr("fare.townLpgcBody")}
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-taxi" aria-hidden="true" />
                    <span>
                      <strong className="font-bold text-volcanic">{tr("fare.townSbt")}</strong>{" "}
                      {tr("fare.townSbtBody")}
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-volcanic/40" aria-hidden="true" />
                    <span>
                      <strong className="font-bold text-volcanic">{tr("fare.townRest")}</strong>{" "}
                      {tr("fare.townRestBody")}
                    </span>
                  </li>
                </ul>
                <p className="mt-3 rounded-xl bg-taxi/10 px-3 py-2 text-xs font-semibold text-volcanic/70">
                  {tr("fare.townNote")}
                </p>
              </div>

              {/* nota + documentos oficiales */}
              <div className="surface p-4 text-sm leading-relaxed text-volcanic/65">
                <p className="font-semibold text-volcanic">{tr("fare.howCalc")}</p>
                <p className="mt-1">{tr("fare.howCalcBody", { m: t.metrosIncluidosUrbano })}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-volcanic/40">
                  {tr("fare.sourcesTitle")}
                </p>
                <ul className="mt-1 space-y-0.5 text-xs text-volcanic/50">
                  <li>{tr("fare.sourceT1")}</li>
                  <li>{tr("fare.sourceT3")}</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
