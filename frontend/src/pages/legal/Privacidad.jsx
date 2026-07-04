import { useNavigate } from "react-router-dom";
import { LogoWordmark } from "../../components/Logo.jsx";
import { useI18n } from "../../i18n/index.jsx";

export default function Privacidad() {
  const nav = useNavigate();
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-cream px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <button onClick={() => nav(-1)} className="mb-6 text-sm font-semibold text-atlantic-dark underline-offset-2 hover:underline">
          ← {t("legal.back")}
        </button>
        <LogoWordmark height={28} className="mb-6" />
        <h1 className="font-display text-2xl font-extrabold text-volcanic">Política de Privacidad</h1>
        <p className="mt-1 text-sm text-volcanic/50">Última actualización: junio 2025</p>
        <p className="mt-4 rounded-xl bg-taxi/15 px-3 py-2 text-xs font-semibold text-volcanic/70">{t("legal.notice")}</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-volcanic/80">
          <section>
            <h2 className="mb-2 font-display text-base font-bold text-volcanic">1. Responsable del tratamiento</h2>
            <p>CanaryCab (en adelante, «la Aplicación») es desarrollada por un operador independiente con domicilio en las Islas Canarias, España. Para cualquier consulta relacionada con la privacidad puede contactar en: <strong>privacidad@canarycab.com</strong>.</p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-base font-bold text-volcanic">2. Datos que recogemos</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li><strong>Datos de registro:</strong> nombre, dirección de correo electrónico, contraseña (almacenada en hash bcrypt), número de teléfono (opcional) y, para taxistas, número de licencia y datos del vehículo.</li>
              <li><strong>Ubicación GPS:</strong> coordenadas en tiempo real mientras la Aplicación está en uso activo y el usuario ha concedido permiso. Los taxistas comparten su ubicación con la plataforma mientras están «En línea». Los clientes comparten su ubicación únicamente para mostrar taxis cercanos y calcular rutas.</li>
              <li><strong>Historial de viajes:</strong> origen, destino, distancia, duración, precio y estado de cada viaje.</li>
              <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador y sistema operativo, registros de acceso (logs).</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-display text-base font-bold text-volcanic">3. Finalidad y base legal</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li><strong>Prestación del servicio</strong> (art. 6.1.b RGPD): gestión de cuentas, solicitud y asignación de viajes, comunicación entre cliente y taxista.</li>
              <li><strong>Interés legítimo</strong> (art. 6.1.f RGPD): seguridad de la plataforma, prevención de fraude, estadísticas de demanda anonimizadas.</li>
              <li><strong>Cumplimiento legal</strong> (art. 6.1.c RGPD): conservación de registros contables y fiscales.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-display text-base font-bold text-volcanic">4. Conservación de datos</h2>
            <p>Los datos de cuenta se conservan mientras la cuenta esté activa. El historial de viajes se conserva durante <strong>5 años</strong> con fines fiscales y de seguridad. La ubicación GPS en tiempo real no se almacena de forma permanente; solo se utiliza para la prestación del servicio durante la sesión activa.</p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-base font-bold text-volcanic">5. Cesión a terceros</h2>
            <p>No cedemos datos personales a terceros salvo:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Proveedores de infraestructura (Railway para el servidor, Vercel para el alojamiento web), bajo acuerdos de encargado del tratamiento conformes al RGPD.</li>
              <li>Cuando sea exigido por obligación legal o resolución judicial.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-display text-base font-bold text-volcanic">6. Derechos del usuario</h2>
            <p>De acuerdo con el RGPD y la LOPDGDD, puede ejercer sus derechos de <strong>acceso, rectificación, supresión, limitación, portabilidad y oposición</strong> enviando un correo a <strong>privacidad@canarycab.com</strong>. También puede presentar una reclamación ante la Agencia Española de Protección de Datos (www.aepd.es).</p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-base font-bold text-volcanic">7. Seguridad</h2>
            <p>Implementamos medidas técnicas y organizativas adecuadas: cifrado HTTPS en todas las comunicaciones, autenticación mediante tokens JWT, contraseñas almacenadas con bcrypt, acceso restringido a la base de datos.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
