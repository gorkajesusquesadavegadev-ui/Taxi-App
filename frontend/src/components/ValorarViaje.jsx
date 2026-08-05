import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useI18n } from "../i18n/index.jsx";

/**
 * Tarjeta de valoración tras un viaje completado. Comprueba si el usuario aún
 * puede valorar (backend) y muestra 5★ + comentario. Se oculta si ya valoró.
 */
// Enlace a la ficha de Google del negocio para dejar reseña. Configurable por
// entorno: cuando se tenga el enlace corto oficial del panel de Google Business
// Profile (https://g.page/r/.../review) basta con cambiar la variable.
const GOOGLE_REVIEW_URL =
  import.meta.env.VITE_GOOGLE_REVIEW_URL ||
  "https://www.google.com/search?q=Canarycab&kgmid=/g/11z9504nhj";

/**
 * @param invitarGoogle  Ofrecer reseña en Google al terminar. Solo tiene
 *   sentido cuando es el CLIENTE valorando su viaje; cuando es el taxista
 *   puntuando al pasajero no procede, por eso hay que activarlo a propósito.
 */
export default function ValorarViaje({ viajeId, etiqueta, invitarGoogle = false }) {
  const { t } = useI18n();
  const label = etiqueta || t("rate.theTrip");
  const [pendiente, setPendiente] = useState(false);
  const [estrellas, setEstrellas] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!viajeId) return;
    api.valoracionPendiente(viajeId).then((p) => alive && setPendiente(!!p)).catch(() => {});
    return () => { alive = false; };
  }, [viajeId]);

  if (!pendiente || enviado) {
    // Tras valorar se invita a dejar reseña en Google. Se ofrece a TODO el que
    // valora, sin mirar cuántas estrellas puso: filtrar para pedírselo solo a
    // los contentos ("review gating") incumple las políticas de Google y puede
    // costar la ficha del negocio.
    return enviado ? (
      <div className="rounded-2xl bg-palm/10 px-4 py-3 text-center">
        <p className="text-sm font-bold text-palm">{t("rate.thanks")}</p>
        {invitarGoogle && (
          <>
            <a
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-volcanic/15 bg-white px-4 py-2 text-sm font-extrabold text-volcanic transition hover:border-volcanic/35 active:scale-95"
            >
              <span aria-hidden="true">★</span> {t("rate.googleCta")}
            </a>
            <p className="mt-1.5 text-[11px] font-medium text-volcanic/45">{t("rate.googleNote")}</p>
          </>
        )}
      </div>
    ) : null;
  }

  async function enviar() {
    if (estrellas < 1) return;
    setBusy(true);
    try {
      await api.valorar(viajeId, estrellas, comentario);
      setEnviado(true);
    } catch (_) {
      setEnviado(true); // si ya estaba valorado, ocultar igualmente
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-taxi/40 bg-white p-4 shadow-card">
      <p className="text-center text-sm font-extrabold text-volcanic">{t("rate.howWas", { label })}</p>
      <div className="mt-2 flex justify-center gap-1.5" role="radiogroup" aria-label="★">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={estrellas === n}
            aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
            onClick={() => setEstrellas(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="text-3xl leading-none transition-transform active:scale-90"
          >
            <span className={(hover || estrellas) >= n ? "text-taxi" : "text-volcanic/20"}>★</span>
          </button>
        ))}
      </div>
      <input
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        maxLength={500}
        placeholder={t("rate.commentPh")}
        className="mt-3 w-full rounded-xl border-2 border-sand-deep bg-cream px-3 py-2 text-sm outline-none focus:border-taxi"
      />
      <button
        onClick={enviar}
        disabled={estrellas < 1 || busy}
        className="mt-2.5 w-full rounded-xl bg-volcanic py-2.5 font-extrabold text-cream transition active:scale-95 disabled:opacity-50"
      >
        {t("rate.send")}
      </button>
    </div>
  );
}
