import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout.jsx";
import Button from "../../components/Button.jsx";
import Spinner from "../../components/Spinner.jsx";
import AddressSearch from "../../components/AddressSearch.jsx";
import ReservaModal from "../../components/ReservaModal.jsx";
import { IconPlane, IconCompass, IconCalendar } from "../../components/icons.jsx";
import { api } from "../../api/client.js";
import { useI18n } from "../../i18n/index.jsx";

import { eur as fmtEur, rangoEur } from "../../utils/precio.js";
// Traduce nombre/descr/duración de la oferta por su id; si no hay clave, usa el valor del backend.
const ofTxt = (t, id, campo, fallback) => {
  const k = `of.${id}.${campo}`;
  const v = t(k);
  return v === k ? (fallback || "") : v;
};

function OfertaCard({ oferta, busy, onSolicitar, onReservar, icon: Icon, t, precioLabel }) {
  return (
    <article className="surface flex flex-col p-4 transition-shadow hover:shadow-float">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-atlantic/12 text-atlantic-dark">
          <Icon />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-extrabold leading-tight">
            {ofTxt(t, oferta.id, "n", oferta.nombre)}
          </h3>
          <p className="mt-1 text-sm leading-snug text-volcanic/60">{ofTxt(t, oferta.id, "d", oferta.descripcion)}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="pill bg-sand text-volcanic/70">{ofTxt(t, oferta.id, "dur", oferta.duracion)}</span>
        <span className="pill bg-sand text-volcanic/70">{t("of.upTo4")}</span>
      </div>
      <div className="mt-3 border-t border-sand-deep/60 pt-3">
        <p className="font-display text-xl font-extrabold">
          {rangoEur(oferta.precioMin, oferta.precioMax, oferta.precio)}
          <span className="ml-1 text-xs font-medium text-volcanic/45">{precioLabel}</span>
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" onClick={onReservar}>
            <IconCalendar width={15} height={15} /> {t("of.book")}
          </Button>
          <Button size="sm" disabled={busy} onClick={onSolicitar}>
            {busy ? <Spinner className="border-volcanic/30 border-t-volcanic" /> : t("of.now")}
          </Button>
        </div>
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
  const { t } = useI18n();
  const esTransfer = tipo === "transfers";
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [recogida, setRecogida] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [reservando, setReservando] = useState(null); // oferta elegida para reservar
  const [okMsg, setOkMsg] = useState("");

  useEffect(() => {
    let alive = true;
    api
      .catalogo()
      .then((c) => alive && setItems(c?.[tipo] || []))
      .catch(() => alive && setError(t("of.couldNotLoadCatalog")));
    return () => {
      alive = false;
    };
  }, [tipo]);

  // Transfers: re-preciar desde la recogida elegida (no es lo mismo salir de
  // Tamaraceite que de Santa Catalina). Excursiones: precio fijo por duración.
  const [preciosRecogida, setPreciosRecogida] = useState({});
  useEffect(() => {
    if (!esTransfer || !recogida || !items?.length) { setPreciosRecogida({}); return; }
    let alive = true;
    Promise.all(
      items.map((o) =>
        api.estimar({
          origenLat: recogida.lat, origenLng: recogida.lng,
          destinoLat: o.destinoLat, destinoLng: o.destinoLng, paradas: [],
        })
          // se guarda también la horquilla: quedarse solo con el importe
          // dejaba el rango del catálogo (calculado para otra recogida) y
          // acababa enseñándose un precio exacto por el camino del fallback
          .then((e) => [o.id, { precio: e.precioEstimado, min: e.precioMin, max: e.precioMax }])
          .catch(() => null)
      )
    ).then((pares) => {
      if (!alive) return;
      setPreciosRecogida(Object.fromEntries(pares.filter(Boolean)));
    });
    return () => { alive = false; };
  }, [esTransfer, recogida?.lat, recogida?.lng, items]);

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
      setError(e.message || t("of.couldNotRequest"));
      setBusyId(null);
    }
  }

  async function confirmarReserva({ programadaPara, notas }) {
    await api.reservarCrear({
      tipo: esTransfer ? "TRANSFER" : "EXCURSION",
      ofertaId: reservando.id,
      origenLat: recogida?.lat ?? null,
      origenLng: recogida?.lng ?? null,
      origenTexto: recogida?.label ?? null,
      programadaPara,
      notas,
    });
    setReservando(null);
    setOkMsg(t("of.bookingSent"));
    setTimeout(() => navigate("/reservas"), 900);
  }

  return (
    <Layout title={esTransfer ? t("nav.transfers") : t("nav.excursions")} framed>
      <div className="h-full overflow-y-auto overflow-x-hidden slim-scroll">
        <div className="mx-auto max-w-5xl space-y-4 p-4 lg:p-6">
          <header>
            <h2 className="font-display text-xl font-extrabold tracking-tight lg:text-2xl">
              {esTransfer ? t("of.transfersTitle") : t("of.excursionsTitle")}
            </h2>
            <p className="mt-1 text-sm text-volcanic/60">
              {esTransfer
                ? t("of.transfersSub")
                : t("of.excursionsSub")}
            </p>
          </header>

          {/* recogida opcional */}
          <div className="surface max-w-xl p-3.5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-volcanic/50">
              {t("of.pickupOptional")}
            </p>
            <AddressSearch
              placeholder={
                esTransfer ? t("of.transferPh") : t("of.excursionPh")
              }
              value={recogida}
              onSelect={setRecogida}
              dotClass="bg-taxi"
            />
            <p className="mt-1.5 text-[11px] text-volcanic/45">
              {t("of.emptyHint")}
            </p>
          </div>

          {error && <p className="text-sm font-semibold text-coral">{error}</p>}
          {okMsg && (
            <p className="rounded-2xl bg-atlantic/12 p-3 text-sm font-semibold text-atlantic-dark">
              {okMsg}
            </p>
          )}

          {!items ? (
            <div className="grid place-items-center py-16">
              <Spinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((o) => (
                <OfertaCard
                  key={o.id}
                  oferta={
                  preciosRecogida[o.id]
                    ? { ...o, precio: preciosRecogida[o.id].precio,
                        precioMin: preciosRecogida[o.id].min, precioMax: preciosRecogida[o.id].max }
                    : o
                }
                  icon={esTransfer ? IconPlane : IconCompass}
                  busy={busyId === o.id}
                  onSolicitar={() => solicitar(o)}
                  onReservar={() => setReservando(o)}
                  t={t}
                  precioLabel={esTransfer ? t("of.approxPrice") : t("of.fixedPrice")}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {reservando && (
        <ReservaModal
          titulo={`${t("of.bookPrefix")} · ${ofTxt(t, reservando.id, "n", reservando.nombre)}`}
          subtitulo={`${rangoEur(reservando.precioMin, reservando.precioMax, reservando.precio)} ${t("of.approxPrice")} · ${ofTxt(t, reservando.id, "dur", reservando.duracion)}`}
          onConfirm={confirmarReserva}
          onClose={() => setReservando(null)}
        />
      )}
    </Layout>
  );
}
