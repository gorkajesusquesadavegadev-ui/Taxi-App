import { useCallback, useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import Card from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import Spinner from "../components/Spinner.jsx";
import { SkeletonList } from "../components/Skeleton.jsx";
import PullToRefresh from "../components/PullToRefresh.jsx";
import { IconPlane, IconCompass, IconPin, IconCalendar, IconWhatsapp } from "../components/icons.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import { connectWs } from "../api/ws.js";
import { avisar } from "../utils/prefs.js";
import { fmtFechaReserva, whatsappLink } from "../utils/reservas.js";
import { useI18n } from "../i18n/index.jsx";

import { eur as fmtEur, rangoEur } from "../utils/precio.js";
const TIPO = {
  TRANSFER: { k: "nav.transfers", icon: IconPlane },
  EXCURSION: { k: "res.excursion", icon: IconCompass },
  NORMAL: { k: "res.trip", icon: IconPin },
};
const ESTADO = {
  PENDIENTE: { k: "res.pending", cls: "bg-taxi/25 text-volcanic" },
  ACEPTADA: { k: "res.accepted", cls: "bg-atlantic/15 text-atlantic-dark" },
  CANCELADA: { k: "res.cancelledSt", cls: "bg-volcanic/10 text-volcanic/55" },
  COMPLETADA: { k: "res.completedSt", cls: "bg-volcanic/10 text-volcanic/55" },
};

// orden: primero las próximas (futuras más cercanas a su hora), luego las pasadas
function ordenar(lista) {
  const ahora = Date.now();
  return [...(lista || [])].sort((a, b) => {
    const ta = new Date(a.programadaPara).getTime();
    const tb = new Date(b.programadaPara).getTime();
    const fa = ta >= ahora, fb = tb >= ahora;
    if (fa && fb) return ta - tb;      // ambas futuras: la más cercana primero
    if (fa) return -1;                 // futuras antes que pasadas
    if (fb) return 1;
    return tb - ta;                    // ambas pasadas: la más reciente primero
  });
}

function EstadoChip({ estado }) {
  const { t } = useI18n();
  const e = ESTADO[estado] || ESTADO.PENDIENTE;
  return <span className={`pill ${e.cls}`}>{t(e.k)}</span>;
}

function Tramo({ origen, destino }) {
  const { t } = useI18n();
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <div className="flex flex-col items-center pt-1.5">
        <span className="h-2 w-2 rounded-full bg-taxi" />
        <span className="my-0.5 h-4 w-px bg-volcanic/15" />
        <span className="h-2 w-2 rounded-full bg-atlantic-dark" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate font-semibold leading-tight">{origen || t("drv.pickup")}</p>
        <p className="truncate font-semibold leading-tight">{destino || t("drv.dest")}</p>
      </div>
    </div>
  );
}

function ReservaCard({ r, rol, onAceptar, onCancelar, busy }) {
  const { t } = useI18n();
  const tipo = TIPO[r.tipo] || TIPO.NORMAL;
  const TipoIcon = tipo.icon;
  const esCliente = rol === "CLIENTE";
  // contacto: el cliente ve al taxista; el taxista ve al cliente
  const contactoNombre = esCliente ? r.taxistaNombre : r.clienteNombre;
  const contactoTel = esCliente ? r.taxistaTelefono : r.clienteTelefono;
  const wa = whatsappLink(
    contactoTel,
    `CanaryCab · ${t(tipo.k)} · ${fmtFechaReserva(r.programadaPara)}`
  );
  const cancelable = r.estado === "PENDIENTE" || r.estado === "ACEPTADA";

  return (
    <Card className="animate-fade-up">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-taxi/20 text-volcanic">
            <TipoIcon width={18} height={18} />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate font-display text-sm font-extrabold">
              {r.detalle || t(tipo.k)}
            </p>
            <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-atlantic-dark">
              <IconCalendar width={12} height={12} />
              {fmtFechaReserva(r.programadaPara)}
            </p>
          </div>
        </div>
        <EstadoChip estado={r.estado} />
      </div>

      <div className="mt-3">
        <Tramo origen={r.origenTexto} destino={r.destinoTexto} />
      </div>

      {r.notas && (
        <p className="mt-2 rounded-xl bg-sand px-3 py-1.5 text-xs text-volcanic/65">📝 {r.notas}</p>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-sand-deep/70 pt-3">
        <span className="text-xs uppercase tracking-wider text-volcanic/45">
          {r.tipo === "NORMAL" ? t("res.estimated") : t("res.closedPrice")}
        </span>
        <span className="font-display text-lg font-extrabold">{rangoEur(r.precioMin, r.precioMax, r.precioEstimado)}</span>
      </div>

      {/* contacto cuando ya está asignada */}
      {r.estado === "ACEPTADA" && contactoNombre && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-atlantic/8 px-3 py-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-volcanic/45">
              {esCliente ? t("res.yourDriver") : t("res.yourClient")}
            </p>
            <p className="truncate text-sm font-semibold">{contactoNombre}</p>
          </div>
          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-2 text-sm font-bold text-white shadow-card transition-transform active:scale-95"
            >
              <IconWhatsapp width={16} height={16} /> WhatsApp
            </a>
          ) : (
            <span className="shrink-0 text-xs text-volcanic/40">{t("res.noPhone")}</span>
          )}
        </div>
      )}

      {/* acciones */}
      <div className="mt-3 flex gap-2">
        {rol === "TAXISTA" && r.estado === "PENDIENTE" && (
          <Button full size="sm" disabled={busy} onClick={() => onAceptar(r)}>
            {busy ? <Spinner className="border-volcanic/30 border-t-volcanic" /> : t("res.acceptBooking")}
          </Button>
        )}
        {cancelable && (rol === "CLIENTE" || r.estado === "ACEPTADA") && (
          <Button
            full
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => onCancelar(r)}
          >
            {t("res.cancel")}
          </Button>
        )}
      </div>
    </Card>
  );
}

export default function Reservas() {
  const { user } = useAuth();
  const { t } = useI18n();
  const esTaxista = user?.rol === "TAXISTA";
  const [tab, setTab] = useState("mias"); // taxista: mias (primero) | disponibles
  const [lista, setLista] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const cargar = useCallback(async () => {
    try {
      let data;
      if (!esTaxista) data = await api.reservasMias();
      else data = tab === "disponibles" ? await api.reservasDisponibles() : await api.reservasTaxista();
      setLista(ordenar(data));
    } catch (e) {
      setError(e.message || t("res.couldNotLoad"));
    }
  }, [esTaxista, tab]);

  useEffect(() => {
    setLista(null);
    cargar();
  }, [cargar]);

  // tiempo real: nuevas reservas / aceptaciones / cancelaciones
  useEffect(() => {
    const ws = connectWs((event, data) => {
      if (event === "reserva:new" && esTaxista) cargar(); // el aviso lo da la campana global
      if (event === "reserva:accepted") {
        if (!esTaxista) avisar(t("res.confirmedT"), t("res.confirmedD", { fecha: fmtFechaReserva(data.programadaPara) }));
        cargar();
      }
      if (event === "reserva:cancelled" || event === "reserva:taken" || event === "reserva:expired") cargar();
    });
    return () => ws.close();
  }, [esTaxista, cargar]);

  async function aceptar(r) {
    setBusyId(r.id);
    try {
      await api.reservaAceptar(r.id);
      avisar(t("res.acceptedT"), t("res.acceptedD", { lugar: r.origenTexto || t("res.markedPoint"), fecha: fmtFechaReserva(r.programadaPara) }));
      await cargar();
    } catch (e) {
      setError(e.message || t("res.couldNotAccept"));
    } finally {
      setBusyId(null);
    }
  }

  async function cancelar(r) {
    setBusyId(r.id);
    try {
      await api.reservaCancelar(r.id);
      await cargar();
    } catch (e) {
      setError(e.message || t("res.couldNotCancel"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Layout title={t("nav.reservations")} framed>
      <PullToRefresh onRefresh={cargar}>
        <div className="mx-auto max-w-3xl space-y-4 p-4 lg:p-6">
          {esTaxista && (
            <div className="relative grid grid-cols-2 rounded-2xl bg-sand p-1 text-sm font-semibold">
              <span
                className={`absolute inset-y-1 w-[calc(50%-4px)] rounded-xl bg-white shadow-sm transition-transform duration-300
                  ${tab === "mias" ? "translate-x-1" : "translate-x-[calc(100%+3px)]"}`}
              />
              {[
                ["mias", t("res.myBookings")],
                ["disponibles", t("res.acceptBookings")],
              ].map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={`relative z-10 rounded-xl py-2 transition-colors ${
                    tab === k ? "text-volcanic" : "text-volcanic/45"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          )}

          {error && <p className="rounded-2xl bg-coral/12 p-4 text-sm text-coral">{error}</p>}

          {!lista && !error && <SkeletonList count={5} />}

          {lista && lista.length === 0 && (
            <div className="grid place-items-center py-16 text-center">
              <span className="mb-3 grid h-16 w-16 place-items-center rounded-3xl bg-atlantic/10 text-atlantic-dark">
                <IconCalendar width={30} height={30} />
              </span>
              <p className="font-display text-lg font-bold">{t("res.none")}</p>
              <p className="text-sm text-volcanic/55">
                {esTaxista
                  ? tab === "disponibles"
                    ? t("res.noneAvail")
                    : t("res.noneAccepted")
                  : t("res.bookFromScreen")}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {lista?.map((r) => (
              <ReservaCard
                key={r.id}
                r={r}
                rol={user?.rol}
                onAceptar={aceptar}
                onCancelar={cancelar}
                busy={busyId === r.id}
              />
            ))}
          </div>
        </div>
      </PullToRefresh>
    </Layout>
  );
}
