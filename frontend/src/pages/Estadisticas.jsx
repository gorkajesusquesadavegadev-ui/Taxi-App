import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import Spinner from "../components/Spinner.jsx";
import { IconChart, IconCar, IconPin } from "../components/icons.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";

const fmtEur = (v) => `${Number(v ?? 0).toFixed(2)} €`;

function StatChip({ label, value, sub, dark }) {
  return (
    <div
      className={`flex-1 rounded-2xl p-4 ${
        dark
          ? "bg-volcanic text-cream shadow-card"
          : "surface"
      }`}
    >
      <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${dark ? "text-taxi" : "text-volcanic/45"}`}>
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-extrabold leading-none">{value}</p>
      {sub && <p className={`mt-1 text-[11px] ${dark ? "text-cream/55" : "text-volcanic/45"}`}>{sub}</p>}
    </div>
  );
}

/** Barras con degradado, valor encima y máximo destacado en amarillo. */
function Barras({ serie }) {
  const vals = serie.map((p) => Number(p.valor));
  const max = Math.max(...vals, 0.01);
  const vacio = vals.every((v) => v === 0);
  if (vacio)
    return (
      <div className="grid h-40 place-items-center rounded-2xl bg-sand text-center">
        <div>
          <p className="font-display font-bold text-volcanic/60">Sin movimientos aún</p>
          <p className="mt-1 text-xs text-volcanic/45">Completa un viaje y aparecerá aquí.</p>
        </div>
      </div>
    );
  return (
    <div className="flex h-44 items-end gap-1 sm:gap-1.5">
      {serie.map((p, i) => {
        const v = vals[i];
        const h = v > 0 ? Math.max(10, (v / max) * 100) : 2.5;
        const esMax = v === max && v > 0;
        return (
          <div key={i} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
            {v > 0 && (
              <span
                className={`hidden whitespace-nowrap text-[9px] font-extrabold sm:block ${
                  esMax ? "text-volcanic" : "text-volcanic/45"
                }`}
              >
                {v >= 100 ? Math.round(v) : v.toFixed(v >= 10 ? 0 : 1)}€
              </span>
            )}
            <div
              title={`${p.etiqueta}: ${fmtEur(v)}`}
              className={`w-full rounded-t-lg transition-all duration-700 ${
                v === 0
                  ? "bg-volcanic/10"
                  : esMax
                    ? "bg-gradient-to-t from-taxi-dark to-taxi shadow-sun"
                    : "bg-gradient-to-t from-atlantic-dark to-atlantic"
              }`}
              style={{ height: `${h}%` }}
            />
            <span className="w-full truncate text-center text-[8.5px] font-bold uppercase text-volcanic/40">
              {p.etiqueta}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TopRutas({ rutas, esTaxista }) {
  if (!rutas.length)
    return (
      <p className="grid h-24 place-items-center rounded-2xl bg-sand text-sm text-volcanic/45">
        Completa viajes para ver tus rutas frecuentes.
      </p>
    );
  return (
    <div className="space-y-4">
      {rutas.map((r, i) => (
        <div key={i} className="flex items-center gap-3">
          <span
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl font-display text-sm font-extrabold ${
              i === 0 ? "bg-taxi text-volcanic shadow-sun" : "bg-sand text-volcanic/50"
            }`}
          >
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">
              {r.origen} <span className="text-volcanic/35">→</span> {r.destino}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-sand-deep/60">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    i === 0 ? "bg-taxi" : "bg-atlantic"
                  }`}
                  style={{ width: `${Math.max(r.pct, 4)}%` }}
                />
              </div>
              <span className="w-12 shrink-0 text-right font-display text-sm font-extrabold text-atlantic-dark">
                {r.pct}%
              </span>
            </div>
          </div>
          <span className="shrink-0 text-[11px] font-bold text-volcanic/45">
            ×{r.veces}
          </span>
        </div>
      ))}
      <p className="text-[11px] text-volcanic/45">
        Probabilidad sobre {esTaxista ? "tus carreras" : "tus viajes"} completados.
      </p>
    </div>
  );
}

export default function Estadisticas() {
  const { user } = useAuth();
  const esTaxista = user?.rol === "TAXISTA";
  const [stats, setStats] = useState(null);
  const [periodo, setPeriodo] = useState("dias"); // dias | meses
  const [error, setError] = useState("");

  useEffect(() => {
    const fetcher = esTaxista ? api.statsTaxista : api.statsCliente;
    fetcher()
      .then(setStats)
      .catch((e) => setError(e.message || "No se pudieron cargar las estadísticas"));
  }, [esTaxista]);

  const dinero = esTaxista ? "Ganado" : "Gastado";
  const serie = stats ? (periodo === "dias" ? stats.porDia : stats.porMes) : [];
  const totalPeriodo = serie.reduce((s, p) => s + Number(p.valor), 0);

  return (
    <Layout title="Estadísticas" framed>
      <div className="h-full overflow-y-auto slim-scroll">
        <div className="mx-auto max-w-3xl space-y-4 p-4 lg:p-6">
          {error && <p className="rounded-2xl bg-coral/12 p-4 text-sm text-coral">{error}</p>}
          {!stats && !error && (
            <div className="grid place-items-center py-16">
              <Spinner />
            </div>
          )}
          {stats && (
            <>
              {/* hero */}
              <header className="mesh-warm relative overflow-hidden rounded-3xl bg-white p-5 shadow-card ring-1 ring-sand-deep/60">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-volcanic text-taxi shadow-card">
                    <IconChart />
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-extrabold tracking-tight">
                      {esTaxista ? "Tu actividad al volante" : "Tus viajes en datos"}
                    </h2>
                    <p className="text-sm text-volcanic/55">
                      Análisis de tu historial guardado en TAYA.
                    </p>
                  </div>
                </div>
              </header>

              {/* resumen */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <StatChip dark label={`${dinero} total`} value={fmtEur(stats.total)} sub="viajes completados" />
                <StatChip
                  label="Viajes"
                  value={stats.viajes}
                  sub={esTaxista ? "carreras completadas" : "completados"}
                />
                <StatChip label="Distancia" value={`${Number(stats.km).toFixed(1)} km`} sub="recorridos en taxi" />
              </div>

              {/* gráfico con selector de periodo */}
              <section className="surface p-5">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display text-base font-extrabold">{dinero}</h3>
                    <p className="text-xs text-volcanic/50">
                      {fmtEur(totalPeriodo)} en {periodo === "dias" ? "los últimos 14 días" : "los últimos 6 meses"}
                    </p>
                  </div>
                  <div className="relative grid grid-cols-2 rounded-xl bg-sand p-1 text-xs font-bold">
                    <span
                      className={`absolute inset-y-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-sm transition-transform duration-300
                        ${periodo === "dias" ? "translate-x-1" : "translate-x-[calc(100%+3px)]"}`}
                    />
                    {[
                      ["dias", "14 días"],
                      ["meses", "6 meses"],
                    ].map(([k, l]) => (
                      <button
                        key={k}
                        onClick={() => setPeriodo(k)}
                        className={`relative z-10 rounded-lg px-3.5 py-1.5 transition-colors ${
                          periodo === k ? "text-volcanic" : "text-volcanic/45"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <Barras serie={serie} />
              </section>

              {/* rutas top */}
              <section className="surface p-5">
                <h3 className="mb-1 flex items-center gap-2 font-display text-base font-extrabold">
                  {esTaxista ? <IconCar width={18} height={18} /> : <IconPin width={18} height={18} />}
                  {esTaxista ? "Tus carreras más repetidas" : "¿A dónde sueles ir?"}
                </h3>
                <p className="mb-4 text-xs text-volcanic/50">
                  Tus trayectos ordenados por frecuencia.
                </p>
                <TopRutas rutas={stats.topRutas} esTaxista={esTaxista} />
              </section>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
