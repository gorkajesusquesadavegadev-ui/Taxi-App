import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import Card from "../components/Card.jsx";
import Badge from "../components/Badge.jsx";
import Spinner from "../components/Spinner.jsx";
import { IconList, IconPlane, IconCompass, IconPin, IconWhatsapp } from "../components/icons.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import { whatsappLink } from "../utils/reservas.js";

const fmtEur = (v) => (v == null ? "—" : `${Number(v).toFixed(2)} €`);
const TIPO = {
  TRANSFER: { label: "Transfer", icon: IconPlane },
  EXCURSION: { label: "Excursión", icon: IconCompass },
};

const fmtFecha = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" }) +
    " · " + d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
};

function TramoRuta({ origen, destino }) {
  return (
    <div className="mt-2 flex items-start gap-2.5 text-sm">
      <div className="flex flex-col items-center pt-1.5">
        <span className="h-2 w-2 rounded-full bg-taxi" />
        <span className="my-0.5 h-4 w-px bg-volcanic/15" />
        <span className="h-2 w-2 rounded-full bg-atlantic-dark" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate font-semibold leading-tight">{origen || "…"}</p>
        <p className="truncate font-semibold leading-tight">{destino || "…"}</p>
      </div>
    </div>
  );
}

function ViajeCard({ v, index, esTaxista }) {
  // los nombres llegan de la BD: el backend los guarda al solicitar y
  // rellena los antiguos al consultar el historial
  const origen = v.origenTexto || "";
  const destino = v.detalle || v.destinoTexto || "";
  const tipo = TIPO[v.tipo];
  const TipoIcon = tipo?.icon || IconPin;

  // contacto con la otra parte (p.ej. te dejaste algo en el taxi)
  const contactoNombre = esTaxista ? v.clienteNombre : v.taxistaNombre;
  const contactoTel = esTaxista ? v.clienteTelefono : v.taxistaTelefono;
  const wa = whatsappLink(
    contactoTel,
    `Hola${contactoNombre ? " " + contactoNombre : ""}, te escribo por el viaje de CanaryCab de ${fmtFecha(v.completadoEn || v.solicitadoEn)}.`
  );

  return (
    <Card className="animate-fade-up" style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
            tipo ? "bg-taxi/20 text-volcanic" : "bg-atlantic/12 text-atlantic-dark"
          }`}>
            <TipoIcon width={18} height={18} />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="text-[11px] font-bold uppercase tracking-wider text-volcanic/45">
              {tipo ? tipo.label : "Viaje"} · {fmtFecha(v.completadoEn || v.solicitadoEn)}
            </p>
            <p className="text-xs text-volcanic/50">
              {Number(v.distanciaRealKm ?? v.distanciaEstimadaKm ?? 0).toFixed(1)} km
            </p>
          </div>
        </div>
        <Badge estado={v.estado} />
      </div>

      <TramoRuta origen={origen || "Punto en el mapa"} destino={destino || "Punto en el mapa"} />

      <div className="mt-3 flex items-end justify-between border-t border-sand-deep/70 pt-3">
        <span className="text-xs uppercase tracking-wider text-volcanic/45">
          {v.precioFinal != null ? "Precio final" : "Estimado"}
        </span>
        <span className="font-display text-xl font-extrabold">
          {fmtEur(v.precioFinal ?? v.precioEstimado)}
        </span>
      </div>

      {/* contacto: por si te dejaste algo en el taxi */}
      {contactoNombre && (contactoTel ? (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-sand px-3 py-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-volcanic/45">
              {esTaxista ? "Cliente" : "Tu taxista"}
            </p>
            <p className="truncate text-sm font-semibold">{contactoNombre}</p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <a
              href={`tel:${contactoTel}`}
              aria-label="Llamar"
              className="grid h-9 w-9 place-items-center rounded-full bg-volcanic text-cream transition-transform active:scale-95"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
              </svg>
            </a>
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="grid h-9 w-9 place-items-center rounded-full bg-[#25D366] text-white transition-transform active:scale-95"
            >
              <IconWhatsapp width={16} height={16} />
            </a>
          </div>
        </div>
      ) : (
        <p className="mt-3 rounded-2xl bg-sand px-3 py-2 text-xs text-volcanic/45">
          {esTaxista ? "Cliente" : "Taxista"} sin teléfono para contacto.
        </p>
      ))}
    </Card>
  );
}

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
      <div className="slim-scroll h-full overflow-y-auto overflow-x-hidden px-4 py-4 lg:px-8 lg:py-6">
        {!viajes && !error && (
          <div className="grid place-items-center py-16">
            <Spinner />
          </div>
        )}
        {error && <p className="rounded-2xl bg-coral/12 p-4 text-sm text-coral">{error}</p>}
        {viajes && viajes.length === 0 && (
          <div className="grid place-items-center py-16 text-center">
            <span className="mb-3 grid h-16 w-16 place-items-center rounded-3xl bg-atlantic/10 text-atlantic-dark">
              <IconList width={30} height={30} />
            </span>
            <p className="font-display text-lg font-bold">Sin viajes todavía</p>
            <p className="text-sm text-volcanic/55">
              {esTaxista ? "Conéctate para recibir carreras." : "Pide tu primer taxi."}
            </p>
          </div>
        )}
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {viajes?.map((v, i) => (
            <ViajeCard key={v.id} v={v} index={i} esTaxista={esTaxista} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
