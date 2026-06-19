import { useNavigate } from "react-router-dom";
import { LogoWordmark } from "../../components/Logo.jsx";

export default function Terminos() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-cream px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <button onClick={() => nav(-1)} className="mb-6 text-sm font-semibold text-atlantic-dark underline-offset-2 hover:underline">
          ← Volver
        </button>
        <LogoWordmark height={28} className="mb-6" />
        <h1 className="font-display text-2xl font-extrabold text-volcanic">Términos y Condiciones de Uso</h1>
        <p className="mt-1 text-sm text-volcanic/50">Última actualización: junio 2025</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-volcanic/80">
          <section>
            <h2 className="mb-2 font-display text-base font-bold text-volcanic">1. Objeto y ámbito</h2>
            <p>CanaryCab es una plataforma digital de intermediación que conecta a usuarios que necesitan un servicio de taxi con conductores autorizados que operan en las Islas Canarias. CanaryCab no es una empresa de transporte; los conductores son profesionales autónomos con licencia VTC o de taxi regulada por la normativa canaria vigente.</p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-base font-bold text-volcanic">2. Requisitos de uso</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Ser mayor de 18 años o contar con autorización de un tutor legal.</li>
              <li>Proporcionar datos verídicos en el registro.</li>
              <li>Para taxistas: poseer licencia de taxi o VTC en vigor emitida por el organismo competente de la Comunidad Autónoma de Canarias.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-display text-base font-bold text-volcanic">3. Tarifas y pagos</h2>
            <p>Las tarifas mostradas en la aplicación son <strong>estimaciones</strong> calculadas conforme a las tarifas oficiales del BOC (Boletín Oficial de Canarias) vigentes en el momento del viaje. El precio definitivo lo determina el taxímetro homologado del vehículo. CanaryCab no procesa pagos; el abono se realiza directamente al conductor al finalizar el servicio (efectivo o el medio acordado entre las partes).</p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-base font-bold text-volcanic">4. Cancelaciones</h2>
            <p>El cliente puede cancelar un viaje hasta que el taxista haya notificado su llegada al punto de recogida. Cancelaciones reiteradas o abusivas pueden resultar en la suspensión temporal de la cuenta.</p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-base font-bold text-volcanic">5. Responsabilidad</h2>
            <p>CanaryCab actúa como mera intermediaria tecnológica. La responsabilidad sobre la prestación del servicio de transporte recae exclusivamente en el conductor autorizado. CanaryCab no responde por daños derivados del servicio de transporte, retrasos, accidentes u otros incidentes durante el viaje.</p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-base font-bold text-volcanic">6. Conducta prohibida</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Uso fraudulento de la plataforma o suplantación de identidad.</li>
              <li>Solicitar viajes sin intención de realizarlos.</li>
              <li>Comportamiento ofensivo o amenazante hacia otros usuarios o conductores.</li>
              <li>Ingeniería inversa, scraping o cualquier uso no autorizado de la API.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-display text-base font-bold text-volcanic">7. Propiedad intelectual</h2>
            <p>El código fuente, diseño, logotipos y contenidos de CanaryCab son propiedad de sus desarrolladores y están protegidos por la legislación española e internacional de propiedad intelectual. Queda prohibida su reproducción sin autorización escrita.</p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-base font-bold text-volcanic">8. Modificaciones</h2>
            <p>CanaryCab se reserva el derecho de modificar estos Términos en cualquier momento. Los cambios sustanciales se comunicarán a los usuarios registrados por correo electrónico con al menos 15 días de antelación.</p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-base font-bold text-volcanic">9. Ley aplicable y jurisdicción</h2>
            <p>Estos Términos se rigen por la legislación española. Para la resolución de controversias, las partes se someten a los Juzgados y Tribunales de Las Palmas de Gran Canaria, salvo que la normativa de consumidores establezca otro fuero.</p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-base font-bold text-volcanic">10. Contacto</h2>
            <p>Para cualquier consulta: <strong>legal@canarycab.com</strong></p>
          </section>
        </div>
      </div>
    </div>
  );
}
