import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { SkeletonList } from "../../components/Skeleton.jsx";

const fmtEur = (v) => (v == null ? "—" : `${Number(v).toFixed(2)} €`);
const fmtFecha = (s) => (s ? new Date(s).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");

const ESTADO_COLOR = {
  COMPLETADO: "bg-palm/15 text-palm",
  CANCELADO: "bg-coral/15 text-coral",
  SOLICITADO: "bg-taxi/20 text-volcanic",
  ACEPTADO: "bg-atlantic/15 text-atlantic-dark",
  EN_CURSO: "bg-atlantic/15 text-atlantic-dark",
  LLEGADO: "bg-atlantic/15 text-atlantic-dark",
};

function Stat({ label, value, accent = "text-volcanic" }) {
  return (
    <div className="rounded-2xl border border-sand-deep bg-white px-4 py-3 shadow-card">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-volcanic/45">{label}</p>
      <p className={`mt-1 font-display text-2xl font-black ${accent}`}>{value}</p>
    </div>
  );
}

export default function AdminPanel() {
  const { logout, user } = useAuth();
  const [tab, setTab] = useState("resumen");
  const [m, setM] = useState(null);
  const [pendientes, setPendientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [viajes, setViajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  async function cargar() {
    setLoading(true);
    try {
      const [met, pend, us, vj] = await Promise.all([
        api.adminMetricas(), api.adminPendientes(), api.adminUsuarios(), api.adminViajes(),
      ]);
      setM(met); setPendientes(pend || []); setUsuarios(us || []); setViajes(vj || []);
    } catch (e) {
      setMsg(e.message || "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { cargar(); }, []);

  async function verificar(id, valor) {
    try { await api.adminVerificar(id, valor); await cargar(); setMsg(valor ? "Taxista verificado ✓" : "Verificación retirada"); }
    catch (e) { setMsg(e.message || "Error"); }
  }
  async function bloquear(id, valor) {
    try { await api.adminBloquear(id, valor); await cargar(); setMsg(valor ? "Usuario bloqueado" : "Usuario desbloqueado"); }
    catch (e) { setMsg(e.message || "Error"); }
  }

  const TABS = [
    { id: "resumen", label: "Resumen" },
    { id: "verificar", label: `Verificar${pendientes.length ? ` (${pendientes.length})` : ""}` },
    { id: "usuarios", label: "Usuarios" },
    { id: "viajes", label: "Viajes" },
  ];

  return (
    <div className="flex h-[100dvh] w-full flex-col bg-cream">
      {/* header */}
      <header
        className="sticky top-0 z-10 flex shrink-0 items-center gap-3 border-b border-sand-deep bg-white px-4 py-3 shadow-sm"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-volcanic font-display text-sm font-black text-taxi">A</span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-base font-extrabold leading-tight text-volcanic">Panel de administración</h1>
          <p className="text-[11px] text-volcanic/50">CanaryCab · {user?.nombre}</p>
        </div>
        <button onClick={cargar} aria-label="Refrescar" className="rounded-xl bg-sand px-3 py-2 text-sm font-bold text-volcanic hover:bg-sand-deep">↻</button>
        <button onClick={logout} className="rounded-xl bg-volcanic px-3 py-2 text-sm font-bold text-cream">Salir</button>
      </header>

      {/* tabs */}
      <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-sand-deep bg-white px-3 py-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
              tab === t.id ? "bg-volcanic text-cream" : "text-volcanic/60 hover:bg-sand"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {msg && (
        <div className="shrink-0 bg-taxi/15 px-4 py-2 text-sm font-semibold text-volcanic" onClick={() => setMsg("")}>
          {msg}
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <SkeletonList count={6} />
        ) : tab === "resumen" ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <Stat label="Usuarios" value={m?.totalUsuarios ?? 0} />
            <Stat label="Clientes" value={m?.totalClientes ?? 0} />
            <Stat label="Taxistas" value={m?.totalTaxistas ?? 0} />
            <Stat label="Pendientes verificar" value={m?.taxistasPendientes ?? 0} accent="text-coral" />
            <Stat label="Taxistas online" value={m?.taxistasOnline ?? 0} accent="text-palm" />
            <Stat label="Viajes hoy" value={m?.viajesHoy ?? 0} accent="text-atlantic-dark" />
            <Stat label="Completados" value={m?.viajesCompletados ?? 0} accent="text-palm" />
            <Stat label="Cancelados" value={m?.viajesCancelados ?? 0} accent="text-coral" />
            <Stat label="Ingresos totales" value={fmtEur(m?.ingresosTotales)} accent="text-volcanic" />
          </div>
        ) : tab === "verificar" ? (
          <div className="space-y-2.5">
            {pendientes.length === 0 ? (
              <p className="py-16 text-center text-volcanic/50">No hay taxistas pendientes de verificar 🎉</p>
            ) : (
              pendientes.map((t) => (
                <div key={t.id} className="rounded-2xl border border-sand-deep bg-white p-4 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-base font-extrabold text-volcanic">{t.nombre}</p>
                      <p className="truncate text-sm text-volcanic/60">{t.email}{t.telefono ? ` · ${t.telefono}` : ""}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
                        {t.licencia && <span className="rounded-md bg-volcanic/10 px-2 py-0.5 font-bold text-volcanic/70">Lic. {t.licencia}</span>}
                        {t.matricula && <span className="rounded-md bg-taxi/20 px-2 py-0.5 font-mono font-black text-volcanic">{t.matricula}</span>}
                        {t.modelo && <span className="rounded-md bg-sand px-2 py-0.5 font-semibold text-volcanic/60">{t.modelo}</span>}
                      </div>
                      <p className="mt-1 text-[11px] text-volcanic/40">Registrado {fmtFecha(t.creadoEn)}</p>
                    </div>
                    <button
                      onClick={() => verificar(t.id, true)}
                      className="shrink-0 rounded-xl bg-palm px-4 py-2 text-sm font-extrabold text-white transition active:scale-95"
                    >
                      ✓ Verificar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : tab === "usuarios" ? (
          <div className="space-y-2">
            {usuarios.map((u) => (
              <div key={u.id} className="flex items-center gap-3 rounded-2xl border border-sand-deep bg-white px-4 py-3 shadow-card">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 font-bold text-volcanic">
                    <span className="truncate">{u.nombre}</span>
                    {u.rol === "TAXISTA" && u.verificado && <span title="Verificado" className="text-palm">✓</span>}
                    {u.bloqueado && <span className="rounded bg-coral/15 px-1.5 text-[10px] font-bold text-coral">BLOQUEADO</span>}
                  </p>
                  <p className="truncate text-xs text-volcanic/55">{u.email} · {u.rol}{u.ratingCount > 0 ? ` · ⭐ ${u.ratingMedia} (${u.ratingCount})` : ""}</p>
                </div>
                {u.rol !== "ADMIN" && (
                  u.bloqueado ? (
                    <button onClick={() => bloquear(u.id, false)} className="shrink-0 rounded-lg bg-palm/15 px-3 py-1.5 text-xs font-bold text-palm">Desbloquear</button>
                  ) : (
                    <button onClick={() => bloquear(u.id, true)} className="shrink-0 rounded-lg bg-coral/15 px-3 py-1.5 text-xs font-bold text-coral">Bloquear</button>
                  )
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {viajes.map((v) => (
              <div key={v.id} className="flex items-center gap-3 rounded-2xl border border-sand-deep bg-white px-4 py-2.5 shadow-card">
                <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-black ${ESTADO_COLOR[v.estado] || "bg-sand text-volcanic/60"}`}>{v.estado}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-volcanic">{v.origen || "—"} → {v.destino || "—"}</p>
                  <p className="text-[11px] text-volcanic/45">#{v.id} · {fmtFecha(v.solicitadoEn)}{v.tipo !== "NORMAL" ? ` · ${v.tipo}` : ""}</p>
                </div>
                <span className="shrink-0 font-display text-sm font-extrabold text-volcanic">{fmtEur(v.precio)}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
