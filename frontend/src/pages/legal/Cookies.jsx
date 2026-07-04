import { useNavigate } from "react-router-dom";
import { LogoWordmark } from "../../components/Logo.jsx";
import { useI18n } from "../../i18n/index.jsx";

export default function Cookies() {
  const nav = useNavigate();
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-cream px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <button onClick={() => nav(-1)} className="mb-6 text-sm font-semibold text-atlantic-dark underline-offset-2 hover:underline">
          ← {t("legal.back")}
        </button>
        <LogoWordmark height={28} className="mb-6" />
        <h1 className="font-display text-2xl font-extrabold text-volcanic">Política de Cookies</h1>
        <p className="mt-1 text-sm text-volcanic/50">Última actualización: junio 2025</p>
        <p className="mt-4 rounded-xl bg-taxi/15 px-3 py-2 text-xs font-semibold text-volcanic/70">{t("legal.notice")}</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-volcanic/80">
          <section>
            <h2 className="mb-2 font-display text-base font-bold text-volcanic">¿Qué son las cookies?</h2>
            <p>Las cookies son pequeños archivos de texto que los sitios web almacenan en su dispositivo para recordar preferencias, mantener sesiones activas y recopilar información de uso anónima.</p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-base font-bold text-volcanic">Cookies que utilizamos</h2>
            <div className="overflow-x-auto rounded-xl border border-sand-deep">
              <table className="w-full text-xs">
                <thead className="bg-sand">
                  <tr>
                    <th className="px-3 py-2 text-left font-bold text-volcanic">Nombre</th>
                    <th className="px-3 py-2 text-left font-bold text-volcanic">Tipo</th>
                    <th className="px-3 py-2 text-left font-bold text-volcanic">Finalidad</th>
                    <th className="px-3 py-2 text-left font-bold text-volcanic">Duración</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-deep/40">
                  <tr>
                    <td className="px-3 py-2 font-mono">taya_token</td>
                    <td className="px-3 py-2">Técnica · Sesión</td>
                    <td className="px-3 py-2">Mantiene la sesión de usuario autenticado (JWT).</td>
                    <td className="px-3 py-2">Sesión del navegador</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-mono">taya:online</td>
                    <td className="px-3 py-2">Técnica · Local</td>
                    <td className="px-3 py-2">Recuerda si el taxista estaba en línea al cerrar la app.</td>
                    <td className="px-3 py-2">Persistente</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-mono">taya:prefs</td>
                    <td className="px-3 py-2">Preferencias</td>
                    <td className="px-3 py-2">Almacena ajustes de sonido y notificaciones.</td>
                    <td className="px-3 py-2">Persistente</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-volcanic/50">CanaryCab <strong>no utiliza cookies de seguimiento, publicidad ni analítica de terceros</strong>.</p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-base font-bold text-volcanic">Almacenamiento local (sessionStorage / localStorage)</h2>
            <p>En lugar de cookies tradicionales, usamos <code className="rounded bg-sand px-1 py-0.5 font-mono text-xs">sessionStorage</code> para la sesión (se borra al cerrar la pestaña) y <code className="rounded bg-sand px-1 py-0.5 font-mono text-xs">localStorage</code> para preferencias persistentes. Estos datos nunca se envían automáticamente al servidor con cada petición.</p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-base font-bold text-volcanic">Gestión y eliminación</h2>
            <p>Puede borrar todas las cookies y datos locales en cualquier momento desde la configuración de su navegador o dispositivo móvil. Al borrarlos, se cerrará la sesión y se restablecerán los ajustes.</p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-base font-bold text-volcanic">Contacto</h2>
            <p>Para cualquier duda sobre el uso de cookies: <strong>privacidad@canarycab.com</strong></p>
          </section>
        </div>
      </div>
    </div>
  );
}
