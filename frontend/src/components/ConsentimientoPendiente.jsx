import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useI18n } from "../i18n/index.jsx";
import Button from "./Button.jsx";
import Spinner from "./Spinner.jsx";

/**
 * Aviso bloqueante para las cuentas creadas ANTES de que el registro tuviera
 * casilla de aceptación.
 *
 * De esas cuentas no hay constancia de que aceptaran la política de privacidad,
 * y el art. 7.1 del RGPD exige poder acreditar el consentimiento. Las
 * alternativas eran pedirlo o borrarles la cuenta; esto es lo razonable.
 *
 * No se puede descartar sin aceptar: un aviso que se cierra con la X no es
 * consentimiento. Sí se puede cerrar sesión, que es la forma de negarse.
 */
export default function ConsentimientoPendiente({ onAceptado, onSalir }) {
  const { t } = useI18n();
  const [marcado, setMarcado] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function aceptar() {
    if (!marcado) return;
    setBusy(true);
    setError("");
    try {
      await api.aceptarConsentimiento();
      onAceptado();
    } catch (e) {
      setError(e.message || t("auth.couldNotComplete"));
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-volcanic/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-cream p-5 shadow-float">
        <h2 className="font-display text-lg font-extrabold text-volcanic">
          {t("consent.title")}
        </h2>
        <p className="mt-2 text-sm leading-snug text-volcanic/70">{t("consent.body")}</p>

        <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl bg-sand/60 p-3">
          <input
            type="checkbox"
            checked={marcado}
            onChange={(e) => setMarcado(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-taxi"
          />
          <span className="text-[11px] leading-snug text-volcanic/70">
            {t("auth.consentPre")}{" "}
            <Link to="/privacidad" target="_blank" className="font-bold underline underline-offset-2">
              {t("legal.privacy")}
            </Link>{" "}
            {t("auth.consentAnd")}{" "}
            <Link to="/terminos" target="_blank" className="font-bold underline underline-offset-2">
              {t("legal.terms")}
            </Link>
            .
          </span>
        </label>

        {error && (
          <p className="mt-3 rounded-xl bg-coral/12 px-3 py-2 text-sm font-semibold text-coral">{error}</p>
        )}

        <Button full className="mt-4" disabled={!marcado || busy} onClick={aceptar}>
          {busy ? <Spinner className="border-volcanic/30 border-t-volcanic" /> : null}
          {t("consent.accept")}
        </Button>
        <button
          type="button"
          onClick={onSalir}
          className="mt-2 w-full py-2 text-xs font-bold text-volcanic/45 hover:text-volcanic/70"
        >
          {t("consent.logout")}
        </button>
      </div>
    </div>
  );
}
