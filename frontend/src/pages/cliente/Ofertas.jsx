import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout.jsx";
import Button from "../../components/Button.jsx";
import Spinner from "../../components/Spinner.jsx";
import AddressSearch from "../../components/AddressSearch.jsx";
import { IconPlane, IconCompass } from "../../components/icons.jsx";
import { api } from "../../api/client.js";

const fmtEur = (v) => `${Number(v).toFixed(2)} €`;

function OfertaCard({ oferta, busy, onSolicitar, icon: Icon }) {
  return (
    <article className="surface flex flex-col p-4 transition-shadow hover:shadow-float">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-atlantic/12 text-atlantic-dark">
          <Icon />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-extrabold leading-tight">
            {oferta.nombre}
          </h3>
          <p className="mt-1 text-sm leading-snug text-volcanic/60">{oferta.descripcion}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="pill bg-sand text-volcanic/70">{oferta.duracion}</span>
        <span className="pill bg-sand text-volcanic/70">hasta 4 plazas</span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-sand-deep/60 pt-3">
        <p className="font-display text-xl font-extrabold">
          {fmtEur(oferta.precio)}
          <span className="ml-1 text-xs font-medium text-volcanic/45">precio cerrado</span>
        </p>
        <Button size="sm" disabled={busy} onClick={onSolicitar}>
          {busy ? <Spinner className="border-volcanic/30 border-t-volcanic" /> : "Solicitar"}
        </Button>
      </div>
    </article>
  );
}

/**
 * Catálogo de ofertas de precio cerrado. tipo: "transfers" | "excursiones".
 * Al solicitar se crea un viaje normal en el sistema: los taxistas conectados
 * lo reciben al instante y el cliente lo sigue desde "Pedir taxi".
 */
export default function Ofertas({ tipo }) {
  const esTransfer = tipo === "transfers";
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [recogida, setRecogida] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    api
      .catalogo()
      .then((c) => alive && setItems(c?.[tipo] || []))
      .catch(() => alive && setError("No se pudo cargar el catálogo"));
    return () => {
      alive = false;
    };
  }, [tipo]);

  async function solicitar(oferta) {
    setBusyId(oferta.id);
    setError("");
    try {
      await api.solicitarOferta({
        ofertaId: oferta.id,
        recogidaLat: recogida?.lat ?? null,
        recogidaLng: recogida?.lng ?? null,
      });
      navigate("/"); // el home del cliente muestra y sigue el viaje activo
    } catch (e) {
      setError(e.message || "No se pudo solicitar");
      setBusyId(null);
    }
  }

  return (
    <Layout title={esTransfer ? "Transfers" : "Excursiones"} framed>
      <div className="h-full overflow-y-auto overflow-x-hidden slim-scroll">
        <div className="mx-auto max-w-5xl space-y-4 p-4 lg:p-6">
          <header>
            <h2 className="font-display text-xl font-extrabold tracking-tight lg:text-2xl">
              {esTransfer ? "Traslados con precio cerrado" : "Descubre la isla en taxi"}
            </h2>
            <p className="mt-1 text-sm text-volcanic/60">
              {esTransfer
                ? "Sin sorpresas: pagas lo acordado, te recoge el primer taxista disponible."
                : "Rutas guiadas por taxistas locales. Precio por taxi, hasta 4 personas."}
            </p>
          </header>

          {/* recogida opcional */}
          <div className="surface max-w-xl p-3.5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-volcanic/50">
              Punto de recogida (opcional)
            </p>
            <AddressSearch
              placeholder={
                esTransfer ? "Ej.: tu terminal u hotel" : "Ej.: tu hotel o dirección"
              }
              value={recogida}
              onSelect={setRecogida}
              dotClass="bg-taxi"
            />
            <p className="mt-1.5 text-[11px] text-volcanic/45">
              Si lo dejas vacío usamos el punto de salida habitual de la oferta.
            </p>
          </div>

          {error && <p className="text-sm font-semibold text-coral">{error}</p>}

          {!items ? (
            <div className="grid place-items-center py-16">
              <Spinner />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((o) => (
                <OfertaCard
                  key={o.id}
                  oferta={o}
                  icon={esTransfer ? IconPlane : IconCompass}
                  busy={busyId === o.id}
                  onSolicitar={() => solicitar(o)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
