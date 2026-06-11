import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import Spinner from "../components/Spinner.jsx";
import { IconChart } from "../components/icons.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";

const fmtEur = (v) => `${Number(v ?? 0).toFixed(2)} €`;

function StatChip({ label, value, accent }) {
  return (
    <div className="surface flex-1 p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-volcanic/45">{label}</p>
      <p className={`mt-1 font-display text-2xl font-extrabold ${accent || ""}`}>{value}</p>
    </div>
  );
}

/** Gráfico de barras CSS: serie [{etiqueta, valor}]. */
function Barras({ serie, color = "bg-atlantic", labelCada = 1 }) {
  const max = Math.max(...serie.map((p) => Number(p.valor)), 0.01);
  const vacio = serie.every((p) => Number(p.valor) === 0);
  if (vacio)
    return (
      <p className="grid h-24 place-items-center rounded-2xl bg-sand text-sm text-volcanic/45">
        Sin movimientos en este periodo todavía.
      </p>
    );
  return (
    <div className="flex h-32 items-end gap-1.5">
      {serie.map((p, i) => {
        const v = Number(p.valor);
        const h = v > 0 ? Math.max(8, (v / max) * 100) : 3;
        return (
          <div key={i} className="group relative flex flex-1 flex-col items-center justify-end">
            <span
              className={`w-full rounded-t-md transition-all duration-500 ${v > 0 ? color : "bg-volcanic/10"}`}
              style={{ height: `${h}%` }}
              title={`${p.etiqueta}: ${fmtEur(v)}`}
            />
            {i % labelCada === 0 && (
              <span className="mt-1 truncate text-[9px] font-semibold uppercase text-volcanic/40">
                {p.etiqueta}
              </span>
            )}
            {/* tooltip */}
            <span className="pointer-events-none absolute -top-7 hidden whitespace-nowrap rounded-lg bg-volcanic px-2 py-0.5 text-[10px] font-bold text-cream group-hover:block">
              {fmtEur(v)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TopRutas({ rutas, esTaxista }) {
  if (!rutas.length)
    return <p className="text-sm text-volcanic/45">Completa viajes para ver tus rutas frecuentes.</p>;
  return (
    <div className="space-y-3">
      {rutas.map((r, i) => (
        <div key={i}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <p className="min-w-0 truncate font-semibold">
              {r.origen} <span className="text-volcanic/40">→</span> {r.destino}
            </p>
            <p className="shrink-0 text-xs font-bold text-volcanic/50">
              {r.veces} {r.veces === 1 ? "vez" : "veces"}
            </p>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-sand-deep/60">
              <div
                className="h-full rounded-full bg-taxi transition-all duration-700"
                style={{ width: `${Math.max(r.pct, 4)}%` }}
              />
            </div>
            <span className="w-10 text-right font-display text-sm font-extrabold text-atlantic-dark">
              {r.pct}%
            </span>
          </div>
        </div>
      ))}
      <p className="text-[11px] text-volcanic/45">
        Probabilidad sobre el total de {esTaxista ? "tus carreras" : "tus viajes"} completados.
      </p>
    </div>
  );
}

export default function Estadisticas() {
  const { user } = useAuth();
  const esTaxista = user?.rol === "TAXISTA";
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetcher = esTaxista ? api.statsTaxista : api.statsCliente;
    fetcher()
      .then(setStats)
      .catch((e) => setError(e.message || "No se pudieron cargar las estadísticas"));
  }, [esTaxista]);

  const dinero = esTaxista ? "Ganado" : "Gastado";

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
              <header className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-atlantic/12 text-atlantic-dark">
                  <IconChart />
                </span>
                <div>
                  <h2 className="font-display text-xl font-extrabold tracking-tight">
                    {esTaxista ? "Tu actividad al volante" : "Tus viajes en datos"}
                  </h2>
                  <p className="text-sm text-volcanic/55">
                    Calculado sobre tu historial guardado en TAYA.
                  </p>
                </div>
              </header>

              {/* resumen */}
              <div className="flex gap-3">
                <StatChip label="Viajes" value={stats.viajes} />
                <StatChip label={`${dinero} total`} value={fmtEur(stats.total)} accent="text-atlantic-dark" />
                <StatChip label="Km recorridos" value={`${Number(stats.km).toFixed(1)} km`} />
              </div>

              {/* por día */}
              <section className="surface p-5">
                <h3 className="mb-4 font-display text-base font-extrabold">
                  {dinero} · últimos 14 días
                </h3>
                <Barras serie={stats.porDia} color="bg-atlantic" labelCada={2} />
              </section>

              {/* por mes */}
              <section className="surface p-5">
                <h3 className="mb-4 font-display text-base font-extrabold">
                  {dinero} · últimos 6 meses
                </h3>
                <Barras serie={stats.porMes} color="bg-taxi" />
              </section>

              {/* rutas top */}
              <section className="surface p-5">
                <h3 className="mb-4 font-display text-base font-extrabold">
                  {esTaxista ? "Tus carreras más repetidas" : "¿A dónde sueles ir?"}
                </h3>
                <TopRutas rutas={stats.topRutas} esTaxista={esTaxista} />
              </section>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
