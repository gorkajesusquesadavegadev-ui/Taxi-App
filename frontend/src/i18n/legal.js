// Contenido legal trilingüe (ES/EN/DE).
// Cada documento: { title, sections: [{ t, p: [..], list: [..], table, note }] }
// En los textos, **negrita** se renderiza como <strong>.
//
// Cuatro documentos:
//   aviso    — Aviso Legal (obligatorio en España por la LSSI-CE art. 10)
//   privacy  — Política de Privacidad (RGPD art. 13)
//   terms    — Términos y Condiciones
//   cookies  — Política de Cookies
//
// IMPORTANTE al tocar esto: lo que se afirme aquí tiene que ser CIERTO. Una
// política que promete algo que el código no hace es peor que no tenerla.

const EMAIL = "gorkajesusquesadavegadev@gmail.com";
const ACTUALIZADO = "Última actualización: agosto de 2026";

export const LEGAL = {
  es: {
    updated: ACTUALIZADO,
    otherDocs: "Otros documentos legales",

    aviso: {
      title: "Aviso Legal",
      sections: [
        {
          t: "1. Titular del sitio web",
          p: [
            "En cumplimiento del artículo 10 de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa de los datos del titular de este sitio web:",
          ],
          list: [
            "**Titular:** Gorka Jesús Quesada Vega",
            "**Domicilio:** Las Palmas de Gran Canaria, Islas Canarias, España",
            `**Correo electrónico de contacto:** ${EMAIL}`,
            "**Sitio web:** https://canarycab.com",
          ],
        },
        {
          t: "2. Objeto",
          p: [
            "CanaryCab es una plataforma digital que pone en contacto a personas que necesitan un taxi con conductores profesionales con licencia que operan en las Islas Canarias.",
            "**CanaryCab no es una empresa de transporte** y no presta el servicio de taxi: actúa exclusivamente como intermediario tecnológico. El servicio de transporte lo presta el conductor titular de la licencia correspondiente, bajo su propia responsabilidad y sujeto a la normativa canaria del taxi.",
          ],
        },
        {
          t: "3. Condiciones de uso",
          p: [
            "El acceso a este sitio web es gratuito y atribuye la condición de usuario, que acepta las condiciones aquí recogidas. El usuario se compromete a utilizar el sitio conforme a la ley, la buena fe y el orden público.",
          ],
        },
        {
          t: "4. Propiedad intelectual e industrial",
          p: [
            "El código fuente, el diseño, los logotipos y los contenidos de CanaryCab pertenecen a su titular y están protegidos por la legislación de propiedad intelectual. Queda prohibida su reproducción o distribución sin autorización escrita.",
            "La cartografía procede de **OpenStreetMap** y sus colaboradores, bajo licencia ODbL. Los datos de tarifas provienen del **Boletín Oficial de Canarias**, de acceso público.",
          ],
        },
        {
          t: "5. Exclusión de responsabilidad",
          p: [
            "El titular no se responsabiliza de los daños derivados del uso del sitio, de la falta de disponibilidad puntual del servicio, ni de la prestación del servicio de transporte, que corresponde en exclusiva al conductor.",
            "Los precios mostrados son **estimaciones** basadas en las tarifas oficiales; el importe exacto lo determina el taxímetro homologado del vehículo.",
          ],
        },
        {
          t: "6. Legislación aplicable",
          p: [
            "Este Aviso Legal se rige por la legislación española. Para cualquier controversia serán competentes los Juzgados y Tribunales de Las Palmas de Gran Canaria, salvo que la normativa de consumidores establezca un fuero distinto.",
          ],
        },
      ],
    },

    privacy: {
      title: "Política de Privacidad",
      sections: [
        {
          t: "1. Responsable del tratamiento",
          list: [
            "**Responsable:** Gorka Jesús Quesada Vega",
            "**Domicilio:** Las Palmas de Gran Canaria, Islas Canarias, España",
            `**Correo de contacto en materia de privacidad:** ${EMAIL}`,
          ],
          p: [
            "No se ha designado Delegado de Protección de Datos por no concurrir ninguno de los supuestos del artículo 37 del RGPD. Puede dirigir cualquier consulta al correo indicado.",
          ],
        },
        {
          t: "2. Datos que recogemos",
          list: [
            "**Datos de registro:** nombre, correo electrónico, contraseña (guardada como hash bcrypt, nunca en claro), teléfono (opcional) y, en el caso de los taxistas, número de licencia y datos del vehículo.",
            "**Registro del consentimiento:** fecha y hora en que aceptó esta política y la versión del texto aceptada. Es una exigencia del artículo 7.1 del RGPD para poder acreditar el consentimiento.",
            "**Alta con Google:** si se registra con «Continuar con Google», recibimos de Google su correo, su nombre y un identificador de cuenta. **No recibimos su contraseña de Google.**",
            "**Ubicación GPS:** posición en tiempo real mientras la aplicación está en uso y usted ha dado permiso. El taxista comparte la suya mientras está «En línea»; el cliente, para mostrar taxis cercanos y calcular la ruta.",
            "**Viajes:** origen, destino, paradas, distancia, duración, precio estimado y estado de cada viaje.",
            "**Valoraciones:** puntuación y comentario que deje tras un viaje.",
            "**Notificaciones:** si las activa, la clave de suscripción que permite enviar avisos a su dispositivo.",
            "**Mensajes del foro de taxistas**, si es taxista y participa en él.",
            "**Datos técnicos:** dirección IP, navegador, sistema operativo y registros de acceso.",
          ],
        },
        {
          t: "3. Finalidad y base legal",
          list: [
            "**Prestar el servicio** (art. 6.1.b RGPD, ejecución de un contrato): crear y gestionar su cuenta, solicitar y asignar viajes, y permitir el contacto entre cliente y conductor durante el trayecto.",
            "**Consentimiento** (art. 6.1.a RGPD): acceso a la ubicación y envío de notificaciones. Puede retirarlo en cualquier momento desde los permisos de su dispositivo, sin que ello afecte a la licitud del tratamiento anterior.",
            "**Interés legítimo** (art. 6.1.f RGPD): seguridad de la plataforma, prevención del fraude y estadísticas agregadas de demanda.",
            "**Interés legítimo de la otra parte** (art. 6.1.f RGPD): conservar el registro anonimizado de un viaje en el historial del conductor, aunque el cliente haya eliminado su cuenta, y viceversa.",
          ],
        },
        {
          t: "4. Decisiones automatizadas",
          p: [
            "La asignación de un viaje a un taxista se realiza de forma automática en función de la cercanía, la disponibilidad y si el vehículo es accesible cuando así se solicita. **No se elaboran perfiles ni se toman decisiones automatizadas que produzcan efectos jurídicos** sobre usted en el sentido del artículo 22 del RGPD.",
          ],
        },
        {
          t: "5. Conservación de datos",
          p: [
            "Los datos de la cuenta se conservan mientras la cuenta esté activa. Al eliminarla, los datos identificativos se borran de inmediato.",
            "Un viaje implica a **dos personas**. Si usted elimina su cuenta, el registro del viaje se conserva **anonimizado** —sin su nombre, teléfono ni correo— porque forma parte del historial de trabajo del conductor, que tiene derecho a conservarlo. Al quedar desvinculado de su identidad deja de ser un dato personal suyo.",
            "La **ubicación GPS en tiempo real no se almacena de forma permanente**: se guarda en memoria durante la sesión activa y caduca automáticamente a los pocos segundos.",
          ],
        },
        {
          t: "6. Destinatarios y transferencias internacionales",
          p: ["No vendemos ni cedemos sus datos. Para funcionar, la aplicación se apoya en los siguientes proveedores:"],
          table: {
            headers: ["Proveedor", "Para qué", "Dónde se tratan"],
            rows: [
              ["Railway", "Servidor y base de datos", "EE. UU. — con Cláusulas Contractuales Tipo"],
              ["Vercel", "Alojamiento de la web y analítica sin cookies", "EE. UU. — con Cláusulas Contractuales Tipo"],
              ["Google", "Inicio de sesión con Google (solo si lo usa)", "EE. UU. — Marco de Privacidad de Datos UE-EE. UU."],
              ["CARTO / OpenStreetMap", "Mapas y callejero", "Unión Europea"],
              ["Komoot (Photon), Cartociudad (IGN)", "Búsqueda de direcciones", "Unión Europea / España"],
            ],
          },
          p2: [],
          note: "Las transferencias fuera de la Unión Europea se amparan en Cláusulas Contractuales Tipo aprobadas por la Comisión Europea o en el Marco de Privacidad de Datos UE-EE. UU.",
        },
        {
          t: "7. Qué ven de usted los demás usuarios",
          list: [
            "Durante un viaje asignado, el cliente ve el **nombre, teléfono, matrícula, modelo y número de licencia** del taxista, para poder identificarlo y contactar con él.",
            "El taxista ve el **nombre y teléfono** del cliente durante ese mismo viaje.",
            "**Al terminar el viaje, los teléfonos dejan de mostrarse.** En el historial solo se conserva el nombre: nadie acumula una agenda con los teléfonos de las personas con las que ha viajado.",
          ],
        },
        {
          t: "8. Sus derechos",
          p: [
            "Puede ejercer los derechos de **acceso, rectificación, supresión, limitación, portabilidad y oposición**, así como **retirar su consentimiento** en cualquier momento.",
            "**Acceso y portabilidad:** en Ajustes → Tus datos → «Descargar mis datos» obtiene al instante una copia completa en formato JSON.",
            "**Supresión:** en Ajustes → Tus datos → «Eliminar mi cuenta» puede borrarla usted mismo, sin escribirnos ni esperar. Sus datos identificativos se borran en el acto.",
            `Para los demás derechos, escriba a **${EMAIL}**. Responderemos en el plazo máximo de un mes.`,
            "Si considera que no hemos atendido correctamente su solicitud, puede reclamar ante la **Agencia Española de Protección de Datos** (www.aepd.es), C/ Jorge Juan 6, 28001 Madrid.",
          ],
        },
        {
          t: "9. Seguridad",
          p: [
            "Aplicamos medidas técnicas y organizativas adecuadas al riesgo: cifrado HTTPS en todas las comunicaciones, autenticación con tokens firmados, contraseñas protegidas con bcrypt, limitación de intentos de acceso, cabeceras de seguridad en el navegador y acceso restringido a la base de datos.",
            "Ningún sistema es infalible. Si llegara a producirse una brecha que suponga un riesgo para sus derechos, se lo comunicaríamos y lo notificaríamos a la autoridad de control conforme a los artículos 33 y 34 del RGPD.",
          ],
        },
        {
          t: "10. Menores de edad",
          p: [
            "El servicio está dirigido a mayores de 18 años. No recogemos conscientemente datos de menores. Si detectamos una cuenta de un menor, la eliminaremos.",
          ],
        },
        {
          t: "11. Cambios en esta política",
          p: [
            "Si modificamos esta política de forma sustancial, se lo comunicaremos por correo electrónico y, cuando la ley lo exija, le pediremos de nuevo su consentimiento.",
          ],
        },
      ],
    },

    terms: {
      title: "Términos y Condiciones de Uso",
      sections: [
        {
          t: "1. Objeto y ámbito",
          p: [
            "CanaryCab es una plataforma digital de intermediación que conecta a personas que necesitan un taxi con conductores profesionales con licencia en las Islas Canarias.",
            "**CanaryCab no es una empresa de transporte.** El servicio lo presta el conductor titular de la licencia, de forma independiente y bajo su responsabilidad, sujeto al Reglamento del Servicio de Taxi de Canarias (Decreto 74/2012) y a la normativa municipal aplicable.",
          ],
        },
        {
          t: "2. Requisitos de uso",
          list: [
            "Ser mayor de 18 años.",
            "Facilitar datos veraces en el registro y mantenerlos actualizados.",
            "Aceptar expresamente la Política de Privacidad al registrarse.",
            "Para conductores: disponer de **licencia de taxi en vigor** expedida por el ayuntamiento competente. La cuenta debe ser verificada por la administración de la plataforma antes de poder aceptar viajes.",
          ],
        },
        {
          t: "3. Precios y pagos",
          p: [
            "Los importes que muestra la aplicación son **estimaciones** calculadas con las tarifas oficiales publicadas en el Boletín Oficial de Canarias vigentes en ese momento, sobre la ruta real entre origen y destino.",
            "**El importe definitivo lo determina el taxímetro homologado del vehículo**, y puede variar respecto a la estimación por el tráfico, las esperas o el recorrido concreto. Por eso el precio se muestra como una horquilla y no como una cifra cerrada.",
            "**CanaryCab no procesa pagos ni cobra comisión al usuario.** El abono se hace directamente al conductor al terminar el trayecto, por el medio que acuerden las partes.",
          ],
        },
        {
          t: "4. Cancelaciones",
          p: [
            "El cliente puede cancelar sin coste hasta que el taxista notifique su llegada al punto de recogida. Las cancelaciones reiteradas o abusivas pueden dar lugar a la suspensión temporal de la cuenta.",
          ],
        },
        {
          t: "5. Responsabilidad",
          p: [
            "CanaryCab actúa como mero intermediario tecnológico. La responsabilidad sobre la prestación del transporte —incluidos retrasos, incidencias, daños o accidentes— corresponde exclusivamente al conductor y a su seguro obligatorio.",
            "La plataforma no garantiza la disponibilidad de un taxi en todo momento ni la ausencia de interrupciones técnicas del servicio.",
            "Nada de lo dispuesto en estos Términos limita los derechos que la normativa de consumidores reconoce de forma imperativa al usuario.",
          ],
        },
        {
          t: "6. Conducta prohibida",
          list: [
            "Uso fraudulento de la plataforma o suplantación de identidad.",
            "Solicitar viajes sin intención real de realizarlos.",
            "Comportamiento ofensivo, discriminatorio o amenazante hacia otros usuarios o conductores.",
            "Ingeniería inversa, extracción masiva de datos o cualquier uso no autorizado de la API.",
          ],
        },
        {
          t: "7. Suspensión y baja",
          p: [
            "El incumplimiento de estos Términos puede conllevar la suspensión o el cierre de la cuenta. El usuario puede darse de baja en cualquier momento desde Ajustes → Tus datos → «Eliminar mi cuenta».",
          ],
        },
        {
          t: "8. Propiedad intelectual",
          p: [
            "El código, el diseño, los logotipos y los contenidos de CanaryCab pertenecen a su titular y están protegidos por la legislación de propiedad intelectual. La cartografía procede de OpenStreetMap y sus colaboradores (licencia ODbL).",
          ],
        },
        {
          t: "9. Modificaciones",
          p: [
            "Estos Términos pueden modificarse. Los cambios sustanciales se comunicarán a los usuarios registrados por correo electrónico con al menos 15 días de antelación.",
          ],
        },
        {
          t: "10. Ley aplicable y jurisdicción",
          p: [
            "Se aplica la legislación española. Para las controversias serán competentes los Juzgados y Tribunales de Las Palmas de Gran Canaria, salvo que la normativa de consumidores establezca otro fuero a favor del usuario.",
          ],
        },
        {
          t: "11. Contacto",
          p: [`Para cualquier consulta: **${EMAIL}**`],
        },
      ],
    },

    cookies: {
      title: "Política de Cookies",
      sections: [
        {
          t: "¿Qué son las cookies?",
          p: [
            "Las cookies y tecnologías similares (como el almacenamiento local del navegador) son pequeños archivos que un sitio web guarda en su dispositivo para recordar preferencias o mantener la sesión abierta.",
          ],
        },
        {
          t: "Qué guardamos nosotros",
          p: [
            "CanaryCab **no usa cookies propias**: guarda lo imprescindible en el almacenamiento local del navegador, que a diferencia de las cookies no se envía al servidor en cada petición.",
          ],
          table: {
            headers: ["Nombre", "Tipo", "Para qué", "Duración"],
            rows: [
              ["taya_token", "Técnica · necesaria", "Mantiene su sesión iniciada.", "Hasta cerrar la pestaña"],
              ["taya:lang", "Preferencia", "Recuerda el idioma elegido.", "Persistente"],
              ["taya:prefs", "Preferencia", "Ajustes de sonido y notificaciones.", "Persistente"],
              ["taya:online", "Técnica · necesaria", "Recuerda si el taxista estaba en línea.", "Persistente"],
            ],
          },
          note: "Todas son **necesarias o de preferencia**, así que no requieren consentimiento previo (art. 22.2 LSSI). No usamos cookies publicitarias ni de seguimiento.",
        },
        {
          t: "Servicios de terceros",
          p: [
            "Algunas funciones se apoyan en terceros que pueden usar sus propias cookies cuando se cargan:",
          ],
          list: [
            "**Google** — solo si usa «Continuar con Google». Al pulsarlo se carga el servicio de Google, que instala cookies propias necesarias para autenticarle. Si no lo usa, no se carga.",
            "**Vercel Analytics** — mide visitas de forma agregada **sin cookies y sin identificar a nadie**, por eso no necesita banner de consentimiento.",
            "**Mapas (CARTO / OpenStreetMap)** — sirven las imágenes del mapa; no se usan para seguirle.",
          ],
        },
        {
          t: "Almacenamiento del navegador y modo sin conexión",
          p: [
            "La aplicación funciona como PWA: un `Service Worker` guarda una copia de la interfaz para que cargue rápido y funcione con mala cobertura. No contiene datos personales.",
          ],
        },
        {
          t: "Cómo eliminarlo",
          p: [
            "Puede borrar cookies y almacenamiento local cuando quiera desde los ajustes de su navegador o dispositivo. Al hacerlo se cerrará la sesión y se restablecerán las preferencias.",
          ],
        },
        {
          t: "Contacto",
          p: [`Para cualquier duda: **${EMAIL}**`],
        },
      ],
    },
  },

  en: {
    updated: "Last updated: August 2026",
    otherDocs: "Other legal documents",

    aviso: {
      title: "Legal Notice",
      sections: [
        {
          t: "1. Website owner",
          p: [
            "In compliance with article 10 of Spanish Law 34/2002 on Information Society Services and Electronic Commerce (LSSI-CE), the details of the owner of this website are:",
          ],
          list: [
            "**Owner:** Gorka Jesús Quesada Vega",
            "**Address:** Las Palmas de Gran Canaria, Canary Islands, Spain",
            `**Contact email:** ${EMAIL}`,
            "**Website:** https://canarycab.com",
          ],
        },
        {
          t: "2. Purpose",
          p: [
            "CanaryCab is a digital platform that connects people who need a taxi with licensed professional drivers operating in the Canary Islands.",
            "**CanaryCab is not a transport company** and does not provide the taxi service: it acts solely as a technological intermediary. The transport service is provided by the licence-holding driver, under their own responsibility and subject to Canary Islands taxi regulations.",
          ],
        },
        {
          t: "3. Terms of use",
          p: [
            "Access to this website is free and grants the status of user, who accepts the conditions set out here. Users undertake to use the site in accordance with the law, good faith and public order.",
          ],
        },
        {
          t: "4. Intellectual property",
          p: [
            "The source code, design, logos and content of CanaryCab belong to its owner and are protected by intellectual property law. Reproduction or distribution without written permission is prohibited.",
            "Mapping data comes from **OpenStreetMap** and its contributors under the ODbL licence. Fare data comes from the **Official Gazette of the Canary Islands**, which is publicly available.",
          ],
        },
        {
          t: "5. Disclaimer",
          p: [
            "The owner is not liable for damages arising from use of the site, from occasional unavailability of the service, or from the provision of the transport service, which is the driver's sole responsibility.",
            "Displayed prices are **estimates**; the exact amount is determined by the vehicle's certified taximeter.",
          ],
        },
        {
          t: "6. Applicable law",
          p: [
            "This Legal Notice is governed by Spanish law. Any dispute shall be submitted to the Courts of Las Palmas de Gran Canaria, unless consumer legislation establishes a different jurisdiction.",
          ],
        },
      ],
    },

    privacy: {
      title: "Privacy Policy",
      sections: [
        {
          t: "1. Data controller",
          list: [
            "**Controller:** Gorka Jesús Quesada Vega",
            "**Address:** Las Palmas de Gran Canaria, Canary Islands, Spain",
            `**Privacy contact email:** ${EMAIL}`,
          ],
          p: [
            "No Data Protection Officer has been appointed, as none of the cases in article 37 GDPR apply. You may address any query to the email above.",
          ],
        },
        {
          t: "2. Data we collect",
          list: [
            "**Registration data:** name, email address, password (stored as a bcrypt hash, never in plain text), phone number (optional) and, for drivers, licence number and vehicle details.",
            "**Consent record:** the date and time you accepted this policy and the version accepted. Article 7.1 GDPR requires us to be able to demonstrate consent.",
            "**Sign-up with Google:** if you use \"Continue with Google\", Google provides us with your email, name and an account identifier. **We never receive your Google password.**",
            "**GPS location:** real-time position while the app is in use and you have granted permission. Drivers share theirs while \"Online\"; clients, to show nearby taxis and calculate the route.",
            "**Trips:** pick-up, destination, stops, distance, duration, estimated price and status of each trip.",
            "**Ratings:** the score and comment you leave after a trip.",
            "**Notifications:** if enabled, the subscription key that allows alerts to be sent to your device.",
            "**Driver forum messages**, if you are a driver and take part in it.",
            "**Technical data:** IP address, browser, operating system and access logs.",
          ],
        },
        {
          t: "3. Purpose and legal basis",
          list: [
            "**Providing the service** (art. 6.1.b GDPR, performance of a contract): creating and managing your account, requesting and assigning trips, and enabling contact between client and driver during the journey.",
            "**Consent** (art. 6.1.a GDPR): access to location and sending notifications. You may withdraw it at any time from your device permissions, without affecting the lawfulness of earlier processing.",
            "**Legitimate interest** (art. 6.1.f GDPR): platform security, fraud prevention and aggregated demand statistics.",
            "**Legitimate interest of the other party** (art. 6.1.f GDPR): keeping the anonymised record of a trip in the driver's history even if the client has deleted their account, and vice versa.",
          ],
        },
        {
          t: "4. Automated decisions",
          p: [
            "Assigning a trip to a driver happens automatically based on proximity, availability and whether the vehicle is accessible when requested. **No profiling or automated decisions producing legal effects** on you are made within the meaning of article 22 GDPR.",
          ],
        },
        {
          t: "5. Data retention",
          p: [
            "Account data is kept while the account is active. When you delete it, identifying data is erased immediately.",
            "A trip involves **two people**. If you delete your account, the trip record is kept **anonymised** —without your name, phone or email— because it is part of the driver's own work history, which they are entitled to keep. Once unlinked from your identity it is no longer your personal data.",
            "**Real-time GPS location is not stored permanently**: it is held in memory during the active session and expires automatically within seconds.",
          ],
        },
        {
          t: "6. Recipients and international transfers",
          p: ["We do not sell or share your data. The app relies on the following providers:"],
          table: {
            headers: ["Provider", "Purpose", "Where data is processed"],
            rows: [
              ["Railway", "Server and database", "USA — Standard Contractual Clauses"],
              ["Vercel", "Web hosting and cookieless analytics", "USA — Standard Contractual Clauses"],
              ["Google", "Sign in with Google (only if you use it)", "USA — EU-US Data Privacy Framework"],
              ["CARTO / OpenStreetMap", "Maps and street data", "European Union"],
              ["Komoot (Photon), Cartociudad (IGN)", "Address search", "European Union / Spain"],
            ],
          },
          note: "Transfers outside the European Union rely on Standard Contractual Clauses approved by the European Commission or on the EU-US Data Privacy Framework.",
        },
        {
          t: "7. What other users see about you",
          list: [
            "During an assigned trip, the client sees the driver's **name, phone, plate, model and licence number**, in order to identify and contact them.",
            "The driver sees the client's **name and phone** during that same trip.",
            "**Once the trip ends, phone numbers are no longer shown.** History keeps only the name: nobody builds up an address book of the people they have travelled with.",
          ],
        },
        {
          t: "8. Your rights",
          p: [
            "You may exercise your rights of **access, rectification, erasure, restriction, portability and objection**, and **withdraw your consent** at any time.",
            "**Access and portability:** Settings → Your data → \"Download my data\" gives you a complete copy in JSON instantly.",
            "**Erasure:** Settings → Your data → \"Delete my account\" lets you delete it yourself, with no need to write to us.",
            `For other rights, write to **${EMAIL}**. We will reply within one month at the latest.`,
            "If you believe your request has not been handled properly, you may complain to the **Spanish Data Protection Agency** (www.aepd.es), C/ Jorge Juan 6, 28001 Madrid.",
          ],
        },
        {
          t: "9. Security",
          p: [
            "We apply technical and organisational measures appropriate to the risk: HTTPS encryption on all communications, signed-token authentication, bcrypt-protected passwords, login rate limiting, browser security headers and restricted database access.",
            "No system is infallible. Should a breach occur that poses a risk to your rights, we would inform you and notify the supervisory authority under articles 33 and 34 GDPR.",
          ],
        },
        {
          t: "10. Minors",
          p: [
            "The service is intended for people aged 18 and over. We do not knowingly collect data from minors. If we detect a minor's account, we will delete it.",
          ],
        },
        {
          t: "11. Changes to this policy",
          p: [
            "If we substantially change this policy, we will inform you by email and, where the law requires it, ask for your consent again.",
          ],
        },
      ],
    },

    terms: {
      title: "Terms and Conditions of Use",
      sections: [
        {
          t: "1. Purpose and scope",
          p: [
            "CanaryCab is a digital intermediation platform connecting people who need a taxi with licensed professional drivers in the Canary Islands.",
            "**CanaryCab is not a transport company.** The service is provided by the licence-holding driver, independently and under their own responsibility, subject to the Canary Islands Taxi Service Regulation (Decree 74/2012) and applicable municipal rules.",
          ],
        },
        {
          t: "2. Requirements for use",
          list: [
            "Being 18 or over.",
            "Providing truthful registration details and keeping them up to date.",
            "Expressly accepting the Privacy Policy when registering.",
            "For drivers: holding a **valid taxi licence** issued by the competent town council. The account must be verified by the platform administration before accepting trips.",
          ],
        },
        {
          t: "3. Prices and payment",
          p: [
            "The amounts shown in the app are **estimates** calculated using the official fares published in the Official Gazette of the Canary Islands in force at the time, over the real route between pick-up and destination.",
            "**The final amount is determined by the vehicle's certified taximeter** and may differ from the estimate due to traffic, waiting time or the exact route taken. That is why the price is shown as a range rather than a fixed figure.",
            "**CanaryCab does not process payments and charges the user no commission.** Payment is made directly to the driver at the end of the trip, by whatever means the parties agree.",
          ],
        },
        {
          t: "4. Cancellations",
          p: [
            "Clients may cancel free of charge until the driver reports arrival at the pick-up point. Repeated or abusive cancellations may lead to temporary account suspension.",
          ],
        },
        {
          t: "5. Liability",
          p: [
            "CanaryCab acts merely as a technological intermediary. Responsibility for providing the transport — including delays, incidents, damage or accidents — lies solely with the driver and their compulsory insurance.",
            "The platform does not guarantee that a taxi will always be available or that the service will be free of technical interruptions.",
            "Nothing in these Terms limits the rights granted to users on a mandatory basis by consumer legislation.",
          ],
        },
        {
          t: "6. Prohibited conduct",
          list: [
            "Fraudulent use of the platform or identity impersonation.",
            "Requesting trips with no genuine intention of taking them.",
            "Offensive, discriminatory or threatening behaviour towards other users or drivers.",
            "Reverse engineering, mass data extraction or any unauthorised use of the API.",
          ],
        },
        {
          t: "7. Suspension and account closure",
          p: [
            "Breaching these Terms may result in suspension or closure of the account. Users may close their account at any time from Settings → Your data → \"Delete my account\".",
          ],
        },
        {
          t: "8. Intellectual property",
          p: [
            "The code, design, logos and content of CanaryCab belong to its owner and are protected by intellectual property law. Mapping data comes from OpenStreetMap and its contributors (ODbL licence).",
          ],
        },
        {
          t: "9. Changes",
          p: [
            "These Terms may be amended. Substantial changes will be communicated to registered users by email at least 15 days in advance.",
          ],
        },
        {
          t: "10. Governing law and jurisdiction",
          p: [
            "Spanish law applies. Disputes shall be submitted to the Courts of Las Palmas de Gran Canaria, unless consumer legislation establishes another jurisdiction in the user's favour.",
          ],
        },
        {
          t: "11. Contact",
          p: [`For any query: **${EMAIL}**`],
        },
      ],
    },

    cookies: {
      title: "Cookie Policy",
      sections: [
        {
          t: "What are cookies?",
          p: [
            "Cookies and similar technologies (such as browser local storage) are small files a website saves on your device to remember preferences or keep your session open.",
          ],
        },
        {
          t: "What we store",
          p: [
            "CanaryCab **uses no cookies of its own**: it stores only what is essential in browser local storage which, unlike cookies, is not sent to the server with every request.",
          ],
          table: {
            headers: ["Name", "Type", "Purpose", "Duration"],
            rows: [
              ["taya_token", "Technical · necessary", "Keeps you signed in.", "Until the tab is closed"],
              ["taya:lang", "Preference", "Remembers the chosen language.", "Persistent"],
              ["taya:prefs", "Preference", "Sound and notification settings.", "Persistent"],
              ["taya:online", "Technical · necessary", "Remembers whether the driver was online.", "Persistent"],
            ],
          },
          note: "All are **necessary or preference-based**, so they require no prior consent (art. 22.2 LSSI). We use no advertising or tracking cookies.",
        },
        {
          t: "Third-party services",
          p: ["Some features rely on third parties that may set their own cookies when loaded:"],
          list: [
            "**Google** — only if you use \"Continue with Google\". Pressing it loads Google's service, which sets its own cookies needed to authenticate you. If you do not use it, it is never loaded.",
            "**Vercel Analytics** — measures visits in aggregate **without cookies and without identifying anyone**, which is why no consent banner is needed.",
            "**Maps (CARTO / OpenStreetMap)** — serve the map imagery; they are not used to track you.",
          ],
        },
        {
          t: "Browser storage and offline mode",
          p: [
            "The app runs as a PWA: a `Service Worker` keeps a copy of the interface so it loads fast and works with poor coverage. It contains no personal data.",
          ],
        },
        {
          t: "How to delete it",
          p: [
            "You can clear cookies and local storage at any time from your browser or device settings. Doing so will sign you out and reset preferences.",
          ],
        },
        {
          t: "Contact",
          p: [`For any query: **${EMAIL}**`],
        },
      ],
    },
  },

  de: {
    updated: "Zuletzt aktualisiert: August 2026",
    otherDocs: "Weitere rechtliche Dokumente",

    aviso: {
      title: "Impressum",
      sections: [
        {
          t: "1. Betreiber der Website",
          p: [
            "Gemäß Artikel 10 des spanischen Gesetzes 34/2002 über Dienste der Informationsgesellschaft und elektronischen Geschäftsverkehr (LSSI-CE) werden die Angaben zum Betreiber dieser Website mitgeteilt:",
          ],
          list: [
            "**Betreiber:** Gorka Jesús Quesada Vega",
            "**Anschrift:** Las Palmas de Gran Canaria, Kanarische Inseln, Spanien",
            `**Kontakt-E-Mail:** ${EMAIL}`,
            "**Website:** https://canarycab.com",
          ],
        },
        {
          t: "2. Gegenstand",
          p: [
            "CanaryCab ist eine digitale Plattform, die Personen, die ein Taxi benötigen, mit lizenzierten Berufsfahrern auf den Kanarischen Inseln zusammenbringt.",
            "**CanaryCab ist kein Transportunternehmen** und erbringt die Taxidienstleistung nicht: Die Plattform vermittelt ausschließlich technisch. Die Beförderung erbringt der Inhaber der jeweiligen Lizenz in eigener Verantwortung nach kanarischem Taxirecht.",
          ],
        },
        {
          t: "3. Nutzungsbedingungen",
          p: [
            "Der Zugang zu dieser Website ist kostenlos und begründet die Nutzereigenschaft; mit der Nutzung werden die hier genannten Bedingungen akzeptiert. Die Nutzung hat im Einklang mit Gesetz, Treu und Glauben sowie der öffentlichen Ordnung zu erfolgen.",
          ],
        },
        {
          t: "4. Geistiges Eigentum",
          p: [
            "Quellcode, Design, Logos und Inhalte von CanaryCab gehören dem Betreiber und sind urheberrechtlich geschützt. Vervielfältigung oder Verbreitung ohne schriftliche Genehmigung ist untersagt.",
            "Das Kartenmaterial stammt von **OpenStreetMap** und seinen Mitwirkenden unter der ODbL-Lizenz. Die Tarifdaten stammen aus dem **Amtsblatt der Kanarischen Inseln** und sind öffentlich zugänglich.",
          ],
        },
        {
          t: "5. Haftungsausschluss",
          p: [
            "Der Betreiber haftet nicht für Schäden aus der Nutzung der Website, für vorübergehende Nichtverfügbarkeit oder für die Beförderungsleistung, die ausschließlich dem Fahrer obliegt.",
            "Die angezeigten Preise sind **Schätzungen**; den genauen Betrag bestimmt das geeichte Taxameter des Fahrzeugs.",
          ],
        },
        {
          t: "6. Anwendbares Recht",
          p: [
            "Für dieses Impressum gilt spanisches Recht. Für Streitigkeiten sind die Gerichte von Las Palmas de Gran Canaria zuständig, sofern das Verbraucherrecht keinen anderen Gerichtsstand vorsieht.",
          ],
        },
      ],
    },

    privacy: {
      title: "Datenschutzerklärung",
      sections: [
        {
          t: "1. Verantwortlicher",
          list: [
            "**Verantwortlicher:** Gorka Jesús Quesada Vega",
            "**Anschrift:** Las Palmas de Gran Canaria, Kanarische Inseln, Spanien",
            `**Kontakt für Datenschutzfragen:** ${EMAIL}`,
          ],
          p: [
            "Es wurde kein Datenschutzbeauftragter benannt, da keiner der Fälle des Artikels 37 DSGVO vorliegt. Anfragen richten Sie bitte an die genannte E-Mail-Adresse.",
          ],
        },
        {
          t: "2. Welche Daten wir erheben",
          list: [
            "**Registrierungsdaten:** Name, E-Mail-Adresse, Passwort (als bcrypt-Hash gespeichert, nie im Klartext), Telefonnummer (optional) und bei Fahrern Lizenznummer sowie Fahrzeugdaten.",
            "**Einwilligungsnachweis:** Datum und Uhrzeit Ihrer Zustimmung zu dieser Erklärung sowie die akzeptierte Fassung. Artikel 7.1 DSGVO verlangt, die Einwilligung nachweisen zu können.",
            "**Anmeldung mit Google:** Bei Nutzung von „Weiter mit Google\" erhalten wir von Google Ihre E-Mail-Adresse, Ihren Namen und eine Konto-Kennung. **Ihr Google-Passwort erhalten wir nie.**",
            "**GPS-Standort:** Position in Echtzeit, solange die App genutzt wird und Sie die Berechtigung erteilt haben. Fahrer teilen ihn im Status „Online\"; Kunden, um nahe Taxis anzuzeigen und die Route zu berechnen.",
            "**Fahrten:** Start, Ziel, Zwischenstopps, Entfernung, Dauer, geschätzter Preis und Status jeder Fahrt.",
            "**Bewertungen:** Note und Kommentar, die Sie nach einer Fahrt hinterlassen.",
            "**Benachrichtigungen:** bei Aktivierung der Schlüssel, mit dem Meldungen an Ihr Gerät gesendet werden können.",
            "**Beiträge im Fahrerforum**, sofern Sie Fahrer sind und daran teilnehmen.",
            "**Technische Daten:** IP-Adresse, Browser, Betriebssystem und Zugriffsprotokolle.",
          ],
        },
        {
          t: "3. Zweck und Rechtsgrundlage",
          list: [
            "**Erbringung des Dienstes** (Art. 6.1.b DSGVO, Vertragserfüllung): Anlegen und Verwalten Ihres Kontos, Anfordern und Zuweisen von Fahrten sowie Kontakt zwischen Kunde und Fahrer während der Fahrt.",
            "**Einwilligung** (Art. 6.1.a DSGVO): Standortzugriff und Benachrichtigungen. Sie können sie jederzeit über die Geräteeinstellungen widerrufen; die Rechtmäßigkeit der vorherigen Verarbeitung bleibt unberührt.",
            "**Berechtigtes Interesse** (Art. 6.1.f DSGVO): Sicherheit der Plattform, Betrugsprävention und aggregierte Nachfragestatistiken.",
            "**Berechtigtes Interesse der Gegenseite** (Art. 6.1.f DSGVO): Aufbewahrung des anonymisierten Fahrteintrags im Verlauf des Fahrers, auch wenn der Kunde sein Konto gelöscht hat, und umgekehrt.",
          ],
        },
        {
          t: "4. Automatisierte Entscheidungen",
          p: [
            "Die Zuweisung einer Fahrt an einen Fahrer erfolgt automatisch nach Nähe, Verfügbarkeit und — auf Wunsch — Barrierefreiheit des Fahrzeugs. **Es findet kein Profiling und keine automatisierte Entscheidung mit rechtlicher Wirkung** im Sinne des Artikels 22 DSGVO statt.",
          ],
        },
        {
          t: "5. Speicherdauer",
          p: [
            "Kontodaten werden gespeichert, solange das Konto besteht. Bei Löschung werden identifizierende Daten sofort entfernt.",
            "An einer Fahrt sind **zwei Personen** beteiligt. Löschen Sie Ihr Konto, bleibt der Fahrteintrag **anonymisiert** erhalten —ohne Name, Telefonnummer und E-Mail—, weil er zum Arbeitsverlauf des Fahrers gehört, den dieser aufbewahren darf. Ohne Bezug zu Ihrer Identität ist er kein personenbezogenes Datum von Ihnen mehr.",
            "**Der GPS-Standort in Echtzeit wird nicht dauerhaft gespeichert**: Er verbleibt während der aktiven Sitzung im Arbeitsspeicher und verfällt nach wenigen Sekunden automatisch.",
          ],
        },
        {
          t: "6. Empfänger und Drittlandtransfers",
          p: ["Wir verkaufen oder überlassen Ihre Daten nicht. Die App nutzt folgende Anbieter:"],
          table: {
            headers: ["Anbieter", "Wofür", "Ort der Verarbeitung"],
            rows: [
              ["Railway", "Server und Datenbank", "USA — Standardvertragsklauseln"],
              ["Vercel", "Webhosting und cookiefreie Analyse", "USA — Standardvertragsklauseln"],
              ["Google", "Anmeldung mit Google (nur bei Nutzung)", "USA — EU-US Data Privacy Framework"],
              ["CARTO / OpenStreetMap", "Karten und Straßendaten", "Europäische Union"],
              ["Komoot (Photon), Cartociudad (IGN)", "Adresssuche", "Europäische Union / Spanien"],
            ],
          },
          note: "Übermittlungen außerhalb der Europäischen Union stützen sich auf von der Europäischen Kommission genehmigte Standardvertragsklauseln oder auf das EU-US Data Privacy Framework.",
        },
        {
          t: "7. Was andere Nutzer über Sie sehen",
          list: [
            "Während einer zugewiesenen Fahrt sieht der Kunde **Name, Telefonnummer, Kennzeichen, Modell und Lizenznummer** des Fahrers, um ihn zu erkennen und zu kontaktieren.",
            "Der Fahrer sieht während derselben Fahrt **Name und Telefonnummer** des Kunden.",
            "**Nach Ende der Fahrt werden die Telefonnummern nicht mehr angezeigt.** Im Verlauf bleibt nur der Name: Niemand sammelt ein Adressbuch der Personen, mit denen er gefahren ist.",
          ],
        },
        {
          t: "8. Ihre Rechte",
          p: [
            "Sie können die Rechte auf **Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch** ausüben sowie Ihre **Einwilligung jederzeit widerrufen**.",
            "**Auskunft und Übertragbarkeit:** Unter Einstellungen → Deine Daten → „Meine Daten herunterladen\" erhalten Sie sofort eine vollständige Kopie im JSON-Format.",
            "**Löschung:** Unter Einstellungen → Deine Daten → „Mein Konto löschen\" können Sie es selbst löschen, ohne uns schreiben zu müssen.",
            `Für die übrigen Rechte schreiben Sie an **${EMAIL}**. Wir antworten spätestens innerhalb eines Monats.`,
            "Wenn Sie meinen, Ihr Anliegen sei nicht ordnungsgemäß bearbeitet worden, können Sie sich bei der **spanischen Datenschutzbehörde** (www.aepd.es), C/ Jorge Juan 6, 28001 Madrid, beschweren.",
          ],
        },
        {
          t: "9. Sicherheit",
          p: [
            "Wir treffen dem Risiko angemessene technische und organisatorische Maßnahmen: HTTPS-Verschlüsselung aller Verbindungen, Authentifizierung mit signierten Tokens, bcrypt-geschützte Passwörter, Begrenzung von Anmeldeversuchen, Sicherheits-Header im Browser und eingeschränkter Datenbankzugriff.",
            "Kein System ist unfehlbar. Sollte es zu einer Verletzung mit Risiko für Ihre Rechte kommen, würden wir Sie informieren und die Aufsichtsbehörde gemäß Art. 33 und 34 DSGVO benachrichtigen.",
          ],
        },
        {
          t: "10. Minderjährige",
          p: [
            "Der Dienst richtet sich an Personen ab 18 Jahren. Wir erheben wissentlich keine Daten von Minderjährigen. Wird ein solches Konto festgestellt, löschen wir es.",
          ],
        },
        {
          t: "11. Änderungen dieser Erklärung",
          p: [
            "Bei wesentlichen Änderungen informieren wir Sie per E-Mail und holen, soweit gesetzlich erforderlich, erneut Ihre Einwilligung ein.",
          ],
        },
      ],
    },

    terms: {
      title: "Nutzungsbedingungen",
      sections: [
        {
          t: "1. Gegenstand und Geltungsbereich",
          p: [
            "CanaryCab ist eine digitale Vermittlungsplattform, die Personen mit Taxibedarf und lizenzierte Berufsfahrer auf den Kanarischen Inseln zusammenbringt.",
            "**CanaryCab ist kein Transportunternehmen.** Die Leistung erbringt der Lizenzinhaber selbstständig und in eigener Verantwortung, nach der kanarischen Taxiverordnung (Dekret 74/2012) und den geltenden kommunalen Vorschriften.",
          ],
        },
        {
          t: "2. Nutzungsvoraussetzungen",
          list: [
            "Mindestalter 18 Jahre.",
            "Wahrheitsgemäße Angaben bei der Registrierung und deren Aktualisierung.",
            "Ausdrückliche Zustimmung zur Datenschutzerklärung bei der Registrierung.",
            "Für Fahrer: **gültige Taxilizenz** der zuständigen Gemeinde. Das Konto muss von der Plattformverwaltung geprüft werden, bevor Fahrten angenommen werden können.",
          ],
        },
        {
          t: "3. Preise und Zahlung",
          p: [
            "Die in der App angezeigten Beträge sind **Schätzungen** auf Basis der jeweils geltenden, im Amtsblatt der Kanarischen Inseln veröffentlichten offiziellen Tarife und der tatsächlichen Route.",
            "**Den endgültigen Betrag bestimmt das geeichte Taxameter des Fahrzeugs**; er kann wegen Verkehr, Wartezeiten oder der konkreten Strecke abweichen. Deshalb wird der Preis als Spanne und nicht als Festbetrag angezeigt.",
            "**CanaryCab wickelt keine Zahlungen ab und erhebt keine Provision vom Nutzer.** Die Zahlung erfolgt direkt an den Fahrer am Ende der Fahrt, auf dem zwischen den Parteien vereinbarten Weg.",
          ],
        },
        {
          t: "4. Stornierungen",
          p: [
            "Kunden können kostenlos stornieren, bis der Fahrer die Ankunft am Abholpunkt meldet. Wiederholte oder missbräuchliche Stornierungen können zur vorübergehenden Sperrung des Kontos führen.",
          ],
        },
        {
          t: "5. Haftung",
          p: [
            "CanaryCab handelt lediglich als technischer Vermittler. Die Verantwortung für die Beförderung — einschließlich Verspätungen, Vorfällen, Schäden oder Unfällen — liegt ausschließlich beim Fahrer und seiner Pflichtversicherung.",
            "Die Plattform garantiert weder die jederzeitige Verfügbarkeit eines Taxis noch einen unterbrechungsfreien technischen Betrieb.",
            "Diese Bedingungen schränken zwingende Verbraucherrechte nicht ein.",
          ],
        },
        {
          t: "6. Verbotenes Verhalten",
          list: [
            "Betrügerische Nutzung der Plattform oder Identitätsmissbrauch.",
            "Anfordern von Fahrten ohne tatsächliche Absicht, sie anzutreten.",
            "Beleidigendes, diskriminierendes oder bedrohliches Verhalten gegenüber anderen Nutzern oder Fahrern.",
            "Reverse Engineering, massenhaftes Auslesen von Daten oder jede unbefugte Nutzung der API.",
          ],
        },
        {
          t: "7. Sperrung und Kontolöschung",
          p: [
            "Verstöße gegen diese Bedingungen können zur Sperrung oder Schließung des Kontos führen. Nutzer können ihr Konto jederzeit unter Einstellungen → Deine Daten → „Mein Konto löschen\" schließen.",
          ],
        },
        {
          t: "8. Geistiges Eigentum",
          p: [
            "Code, Design, Logos und Inhalte von CanaryCab gehören dem Betreiber und sind urheberrechtlich geschützt. Das Kartenmaterial stammt von OpenStreetMap und seinen Mitwirkenden (ODbL-Lizenz).",
          ],
        },
        {
          t: "9. Änderungen",
          p: [
            "Diese Bedingungen können geändert werden. Wesentliche Änderungen werden registrierten Nutzern mindestens 15 Tage im Voraus per E-Mail mitgeteilt.",
          ],
        },
        {
          t: "10. Anwendbares Recht und Gerichtsstand",
          p: [
            "Es gilt spanisches Recht. Für Streitigkeiten sind die Gerichte von Las Palmas de Gran Canaria zuständig, sofern das Verbraucherrecht keinen für den Nutzer günstigeren Gerichtsstand vorsieht.",
          ],
        },
        {
          t: "11. Kontakt",
          p: [`Für Anfragen: **${EMAIL}**`],
        },
      ],
    },

    cookies: {
      title: "Cookie-Richtlinie",
      sections: [
        {
          t: "Was sind Cookies?",
          p: [
            "Cookies und ähnliche Technologien (etwa der lokale Browserspeicher) sind kleine Dateien, die eine Website auf Ihrem Gerät ablegt, um Einstellungen zu merken oder die Sitzung offen zu halten.",
          ],
        },
        {
          t: "Was wir speichern",
          p: [
            "CanaryCab **verwendet keine eigenen Cookies**: Es speichert nur das Nötigste im lokalen Browserspeicher, der — anders als Cookies — nicht bei jeder Anfrage an den Server gesendet wird.",
          ],
          table: {
            headers: ["Name", "Art", "Wofür", "Dauer"],
            rows: [
              ["taya_token", "Technisch · notwendig", "Hält Sie angemeldet.", "Bis zum Schließen des Tabs"],
              ["taya:lang", "Präferenz", "Merkt sich die gewählte Sprache.", "Dauerhaft"],
              ["taya:prefs", "Präferenz", "Ton- und Benachrichtigungseinstellungen.", "Dauerhaft"],
              ["taya:online", "Technisch · notwendig", "Merkt sich, ob der Fahrer online war.", "Dauerhaft"],
            ],
          },
          note: "Alle sind **notwendig oder Präferenz-Einträge** und bedürfen daher keiner vorherigen Einwilligung (Art. 22.2 LSSI). Wir setzen keine Werbe- oder Tracking-Cookies ein.",
        },
        {
          t: "Dienste Dritter",
          p: ["Einige Funktionen stützen sich auf Dritte, die beim Laden eigene Cookies setzen können:"],
          list: [
            "**Google** — nur bei Nutzung von „Weiter mit Google\". Beim Klick wird der Google-Dienst geladen, der eigene, für die Anmeldung notwendige Cookies setzt. Ohne Nutzung wird er nie geladen.",
            "**Vercel Analytics** — misst Besuche aggregiert **ohne Cookies und ohne Identifizierung**, weshalb kein Einwilligungsbanner nötig ist.",
            "**Karten (CARTO / OpenStreetMap)** — liefern das Kartenbild; sie dienen nicht der Nachverfolgung.",
          ],
        },
        {
          t: "Browserspeicher und Offline-Modus",
          p: [
            "Die App läuft als PWA: Ein `Service Worker` hält eine Kopie der Oberfläche vor, damit sie schnell lädt und bei schlechtem Empfang funktioniert. Er enthält keine personenbezogenen Daten.",
          ],
        },
        {
          t: "Wie Sie es löschen",
          p: [
            "Sie können Cookies und lokalen Speicher jederzeit über die Einstellungen Ihres Browsers oder Geräts löschen. Dabei werden Sie abgemeldet und die Einstellungen zurückgesetzt.",
          ],
        },
        {
          t: "Kontakt",
          p: [`Bei Fragen: **${EMAIL}**`],
        },
      ],
    },
  },
};
