// Contenido legal trilingüe (ES/EN/DE).
// Cada documento: { title, updated, sections: [{ t, p: [..], list: [..], table }] }
// En los textos, **negrita** se renderiza como <strong>.

export const LEGAL = {
  es: {
    updated: "Última actualización: junio 2025",
    otherDocs: "Otros documentos legales",
    privacy: {
      title: "Política de Privacidad",
      sections: [
        {
          t: "1. Responsable del tratamiento",
          p: ["CanaryCab (en adelante, «la Aplicación») es desarrollada por un operador independiente con domicilio en las Islas Canarias, España. Para cualquier consulta relacionada con la privacidad puede contactar en: **privacidad@canarycab.com**."],
        },
        {
          t: "2. Datos que recogemos",
          list: [
            "**Datos de registro:** nombre, dirección de correo electrónico, contraseña (almacenada en hash bcrypt), número de teléfono (opcional) y, para taxistas, número de licencia y datos del vehículo.",
            "**Ubicación GPS:** coordenadas en tiempo real mientras la Aplicación está en uso activo y el usuario ha concedido permiso. Los taxistas comparten su ubicación con la plataforma mientras están «En línea». Los clientes comparten su ubicación únicamente para mostrar taxis cercanos y calcular rutas.",
            "**Historial de viajes:** origen, destino, distancia, duración, precio y estado de cada viaje.",
            "**Datos técnicos:** dirección IP, tipo de navegador y sistema operativo, registros de acceso (logs).",
          ],
        },
        {
          t: "3. Finalidad y base legal",
          list: [
            "**Prestación del servicio** (art. 6.1.b RGPD): gestión de cuentas, solicitud y asignación de viajes, comunicación entre cliente y taxista.",
            "**Interés legítimo** (art. 6.1.f RGPD): seguridad de la plataforma, prevención de fraude, estadísticas de demanda anonimizadas.",
            "**Cumplimiento legal** (art. 6.1.c RGPD): conservación de registros contables y fiscales.",
          ],
        },
        {
          t: "4. Conservación de datos",
          p: ["Los datos de cuenta se conservan mientras la cuenta esté activa. El historial de viajes se conserva durante **5 años** con fines fiscales y de seguridad. La ubicación GPS en tiempo real no se almacena de forma permanente; solo se utiliza para la prestación del servicio durante la sesión activa."],
        },
        {
          t: "5. Cesión a terceros",
          p: ["No cedemos datos personales a terceros salvo:"],
          list: [
            "Proveedores de infraestructura (Railway para el servidor, Vercel para el alojamiento web), bajo acuerdos de encargado del tratamiento conformes al RGPD.",
            "Cuando sea exigido por obligación legal o resolución judicial.",
          ],
        },
        {
          t: "6. Derechos del usuario",
          p: ["De acuerdo con el RGPD y la LOPDGDD, puede ejercer sus derechos de **acceso, rectificación, supresión, limitación, portabilidad y oposición** enviando un correo a **privacidad@canarycab.com**. También puede presentar una reclamación ante la Agencia Española de Protección de Datos (www.aepd.es)."],
        },
        {
          t: "7. Seguridad",
          p: ["Implementamos medidas técnicas y organizativas adecuadas: cifrado HTTPS en todas las comunicaciones, autenticación mediante tokens JWT, contraseñas almacenadas con bcrypt, acceso restringido a la base de datos."],
        },
      ],
    },
    terms: {
      title: "Términos y Condiciones de Uso",
      sections: [
        {
          t: "1. Objeto y ámbito",
          p: ["CanaryCab es una plataforma digital de intermediación que conecta a usuarios que necesitan un servicio de taxi con conductores autorizados que operan en las Islas Canarias. CanaryCab no es una empresa de transporte; los conductores son profesionales autónomos con licencia VTC o de taxi regulada por la normativa canaria vigente."],
        },
        {
          t: "2. Requisitos de uso",
          list: [
            "Ser mayor de 18 años o contar con autorización de un tutor legal.",
            "Proporcionar datos verídicos en el registro.",
            "Para taxistas: poseer licencia de taxi o VTC en vigor emitida por el organismo competente de la Comunidad Autónoma de Canarias.",
          ],
        },
        {
          t: "3. Tarifas y pagos",
          p: ["Las tarifas mostradas en la aplicación son **estimaciones** calculadas conforme a las tarifas oficiales del BOC (Boletín Oficial de Canarias) vigentes en el momento del viaje. El precio definitivo lo determina el taxímetro homologado del vehículo. CanaryCab no procesa pagos; el abono se realiza directamente al conductor al finalizar el servicio (efectivo o el medio acordado entre las partes)."],
        },
        {
          t: "4. Cancelaciones",
          p: ["El cliente puede cancelar un viaje hasta que el taxista haya notificado su llegada al punto de recogida. Cancelaciones reiteradas o abusivas pueden resultar en la suspensión temporal de la cuenta."],
        },
        {
          t: "5. Responsabilidad",
          p: ["CanaryCab actúa como mera intermediaria tecnológica. La responsabilidad sobre la prestación del servicio de transporte recae exclusivamente en el conductor autorizado. CanaryCab no responde por daños derivados del servicio de transporte, retrasos, accidentes u otros incidentes durante el viaje."],
        },
        {
          t: "6. Conducta prohibida",
          list: [
            "Uso fraudulento de la plataforma o suplantación de identidad.",
            "Solicitar viajes sin intención de realizarlos.",
            "Comportamiento ofensivo o amenazante hacia otros usuarios o conductores.",
            "Ingeniería inversa, scraping o cualquier uso no autorizado de la API.",
          ],
        },
        {
          t: "7. Propiedad intelectual",
          p: ["El código fuente, diseño, logotipos y contenidos de CanaryCab son propiedad de sus desarrolladores y están protegidos por la legislación española e internacional de propiedad intelectual. Queda prohibida su reproducción sin autorización escrita."],
        },
        {
          t: "8. Modificaciones",
          p: ["CanaryCab se reserva el derecho de modificar estos Términos en cualquier momento. Los cambios sustanciales se comunicarán a los usuarios registrados por correo electrónico con al menos 15 días de antelación."],
        },
        {
          t: "9. Ley aplicable y jurisdicción",
          p: ["Estos Términos se rigen por la legislación española. Para la resolución de controversias, las partes se someten a los Juzgados y Tribunales de Las Palmas de Gran Canaria, salvo que la normativa de consumidores establezca otro fuero."],
        },
        {
          t: "10. Contacto",
          p: ["Para cualquier consulta: **legal@canarycab.com**"],
        },
      ],
    },
    cookies: {
      title: "Política de Cookies",
      sections: [
        {
          t: "¿Qué son las cookies?",
          p: ["Las cookies son pequeños archivos de texto que los sitios web almacenan en su dispositivo para recordar preferencias, mantener sesiones activas y recopilar información de uso anónima."],
        },
        {
          t: "Cookies que utilizamos",
          table: {
            headers: ["Nombre", "Tipo", "Finalidad", "Duración"],
            rows: [
              ["taya_token", "Técnica · Sesión", "Mantiene la sesión de usuario autenticado (JWT).", "Sesión del navegador"],
              ["taya:online", "Técnica · Local", "Recuerda si el taxista estaba en línea al cerrar la app.", "Persistente"],
              ["taya:prefs", "Preferencias", "Almacena ajustes de sonido y notificaciones.", "Persistente"],
            ],
          },
          note: "CanaryCab **no utiliza cookies de seguimiento, publicidad ni analítica de terceros**.",
        },
        {
          t: "Almacenamiento local (sessionStorage / localStorage)",
          p: ["En lugar de cookies tradicionales, usamos `sessionStorage` para la sesión (se borra al cerrar la pestaña) y `localStorage` para preferencias persistentes. Estos datos nunca se envían automáticamente al servidor con cada petición."],
        },
        {
          t: "Gestión y eliminación",
          p: ["Puede borrar todas las cookies y datos locales en cualquier momento desde la configuración de su navegador o dispositivo móvil. Al borrarlos, se cerrará la sesión y se restablecerán los ajustes."],
        },
        {
          t: "Contacto",
          p: ["Para cualquier duda sobre el uso de cookies: **privacidad@canarycab.com**"],
        },
      ],
    },
  },

  en: {
    updated: "Last updated: June 2025",
    otherDocs: "Other legal documents",
    privacy: {
      title: "Privacy Policy",
      sections: [
        {
          t: "1. Data controller",
          p: ["CanaryCab (hereinafter, “the Application”) is developed by an independent operator domiciled in the Canary Islands, Spain. For any privacy-related enquiry you can contact: **privacidad@canarycab.com**."],
        },
        {
          t: "2. Data we collect",
          list: [
            "**Registration data:** name, email address, password (stored as a bcrypt hash), phone number (optional) and, for drivers, licence number and vehicle details.",
            "**GPS location:** real-time coordinates while the Application is in active use and the user has granted permission. Drivers share their location with the platform while they are “Online”. Clients share their location only to display nearby taxis and calculate routes.",
            "**Trip history:** origin, destination, distance, duration, price and status of each trip.",
            "**Technical data:** IP address, browser type and operating system, access logs.",
          ],
        },
        {
          t: "3. Purpose and legal basis",
          list: [
            "**Provision of the service** (art. 6.1.b GDPR): account management, trip requests and assignment, communication between client and driver.",
            "**Legitimate interest** (art. 6.1.f GDPR): platform security, fraud prevention, anonymised demand statistics.",
            "**Legal compliance** (art. 6.1.c GDPR): retention of accounting and tax records.",
          ],
        },
        {
          t: "4. Data retention",
          p: ["Account data is kept while the account remains active. Trip history is retained for **5 years** for tax and security purposes. Real-time GPS location is not stored permanently; it is only used to provide the service during the active session."],
        },
        {
          t: "5. Disclosure to third parties",
          p: ["We do not share personal data with third parties except:"],
          list: [
            "Infrastructure providers (Railway for the server, Vercel for web hosting), under GDPR-compliant data-processor agreements.",
            "When required by legal obligation or court order.",
          ],
        },
        {
          t: "6. Your rights",
          p: ["Under the GDPR and Spanish LOPDGDD you may exercise your rights of **access, rectification, erasure, restriction, portability and objection** by emailing **privacidad@canarycab.com**. You may also lodge a complaint with the Spanish Data Protection Agency (www.aepd.es)."],
        },
        {
          t: "7. Security",
          p: ["We implement appropriate technical and organisational measures: HTTPS encryption on all communications, JWT token authentication, passwords stored with bcrypt, restricted database access."],
        },
      ],
    },
    terms: {
      title: "Terms and Conditions of Use",
      sections: [
        {
          t: "1. Purpose and scope",
          p: ["CanaryCab is a digital intermediation platform connecting users who need a taxi service with authorised drivers operating in the Canary Islands. CanaryCab is not a transport company; drivers are self-employed professionals holding a taxi or VTC licence regulated by current Canary Islands legislation."],
        },
        {
          t: "2. Requirements for use",
          list: [
            "Be over 18 years old or have the authorisation of a legal guardian.",
            "Provide truthful information when registering.",
            "For drivers: hold a valid taxi or VTC licence issued by the competent authority of the Autonomous Community of the Canary Islands.",
          ],
        },
        {
          t: "3. Fares and payments",
          p: ["Fares shown in the application are **estimates** calculated according to the official BOC (Official Gazette of the Canary Islands) rates in force at the time of the trip. The final price is determined by the vehicle's approved taximeter. CanaryCab does not process payments; payment is made directly to the driver at the end of the service (cash or any means agreed between the parties)."],
        },
        {
          t: "4. Cancellations",
          p: ["The client may cancel a trip until the driver has notified their arrival at the pickup point. Repeated or abusive cancellations may result in temporary account suspension."],
        },
        {
          t: "5. Liability",
          p: ["CanaryCab acts solely as a technological intermediary. Responsibility for the provision of the transport service lies exclusively with the authorised driver. CanaryCab is not liable for damages arising from the transport service, delays, accidents or other incidents during the trip."],
        },
        {
          t: "6. Prohibited conduct",
          list: [
            "Fraudulent use of the platform or identity impersonation.",
            "Requesting trips with no intention of taking them.",
            "Offensive or threatening behaviour towards other users or drivers.",
            "Reverse engineering, scraping or any unauthorised use of the API.",
          ],
        },
        {
          t: "7. Intellectual property",
          p: ["The source code, design, logos and contents of CanaryCab are the property of its developers and are protected by Spanish and international intellectual property law. Reproduction without written authorisation is prohibited."],
        },
        {
          t: "8. Changes",
          p: ["CanaryCab reserves the right to modify these Terms at any time. Substantial changes will be notified to registered users by email at least 15 days in advance."],
        },
        {
          t: "9. Governing law and jurisdiction",
          p: ["These Terms are governed by Spanish law. For the resolution of disputes, the parties submit to the Courts of Las Palmas de Gran Canaria, unless consumer law establishes another forum."],
        },
        {
          t: "10. Contact",
          p: ["For any enquiry: **legal@canarycab.com**"],
        },
      ],
    },
    cookies: {
      title: "Cookie Policy",
      sections: [
        {
          t: "What are cookies?",
          p: ["Cookies are small text files that websites store on your device to remember preferences, keep sessions active and collect anonymous usage information."],
        },
        {
          t: "Cookies we use",
          table: {
            headers: ["Name", "Type", "Purpose", "Duration"],
            rows: [
              ["taya_token", "Technical · Session", "Keeps the authenticated user session (JWT).", "Browser session"],
              ["taya:online", "Technical · Local", "Remembers whether the driver was online when the app was closed.", "Persistent"],
              ["taya:prefs", "Preferences", "Stores sound and notification settings.", "Persistent"],
            ],
          },
          note: "CanaryCab **does not use tracking, advertising or third-party analytics cookies**.",
        },
        {
          t: "Local storage (sessionStorage / localStorage)",
          p: ["Instead of traditional cookies, we use `sessionStorage` for the session (cleared when the tab is closed) and `localStorage` for persistent preferences. This data is never sent automatically to the server with each request."],
        },
        {
          t: "Management and deletion",
          p: ["You can delete all cookies and local data at any time from your browser or mobile device settings. Deleting them will log you out and reset your settings."],
        },
        {
          t: "Contact",
          p: ["For any question about the use of cookies: **privacidad@canarycab.com**"],
        },
      ],
    },
  },

  de: {
    updated: "Zuletzt aktualisiert: Juni 2025",
    otherDocs: "Weitere Rechtsdokumente",
    privacy: {
      title: "Datenschutzerklärung",
      sections: [
        {
          t: "1. Verantwortlicher",
          p: ["CanaryCab (im Folgenden „die Anwendung“) wird von einem unabhängigen Betreiber mit Sitz auf den Kanarischen Inseln, Spanien, entwickelt. Bei Fragen zum Datenschutz erreichen Sie uns unter: **privacidad@canarycab.com**."],
        },
        {
          t: "2. Erhobene Daten",
          list: [
            "**Registrierungsdaten:** Name, E-Mail-Adresse, Passwort (als bcrypt-Hash gespeichert), Telefonnummer (optional) und bei Fahrern Lizenznummer und Fahrzeugdaten.",
            "**GPS-Standort:** Echtzeit-Koordinaten, während die Anwendung aktiv genutzt wird und der Nutzer die Berechtigung erteilt hat. Fahrer teilen ihren Standort mit der Plattform, solange sie „Online“ sind. Kunden teilen ihren Standort nur, um Taxis in der Nähe anzuzeigen und Routen zu berechnen.",
            "**Fahrtenhistorie:** Start, Ziel, Entfernung, Dauer, Preis und Status jeder Fahrt.",
            "**Technische Daten:** IP-Adresse, Browsertyp und Betriebssystem, Zugriffsprotokolle (Logs).",
          ],
        },
        {
          t: "3. Zweck und Rechtsgrundlage",
          list: [
            "**Erbringung des Dienstes** (Art. 6 Abs. 1 lit. b DSGVO): Kontoverwaltung, Anforderung und Zuweisung von Fahrten, Kommunikation zwischen Kunde und Fahrer.",
            "**Berechtigtes Interesse** (Art. 6 Abs. 1 lit. f DSGVO): Sicherheit der Plattform, Betrugsprävention, anonymisierte Nachfragestatistiken.",
            "**Rechtliche Verpflichtung** (Art. 6 Abs. 1 lit. c DSGVO): Aufbewahrung von Buchhaltungs- und Steuerunterlagen.",
          ],
        },
        {
          t: "4. Speicherdauer",
          p: ["Kontodaten werden gespeichert, solange das Konto aktiv ist. Die Fahrtenhistorie wird zu Steuer- und Sicherheitszwecken **5 Jahre** aufbewahrt. Der Echtzeit-GPS-Standort wird nicht dauerhaft gespeichert; er wird nur zur Erbringung des Dienstes während der aktiven Sitzung verwendet."],
        },
        {
          t: "5. Weitergabe an Dritte",
          p: ["Wir geben personenbezogene Daten nicht an Dritte weiter, außer:"],
          list: [
            "Infrastrukturanbieter (Railway für den Server, Vercel für das Webhosting) im Rahmen DSGVO-konformer Auftragsverarbeitungsverträge.",
            "Wenn dies gesetzlich vorgeschrieben oder gerichtlich angeordnet ist.",
          ],
        },
        {
          t: "6. Ihre Rechte",
          p: ["Gemäß DSGVO und spanischem LOPDGDD können Sie Ihre Rechte auf **Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch** per E-Mail an **privacidad@canarycab.com** ausüben. Sie können auch eine Beschwerde bei der spanischen Datenschutzbehörde einreichen (www.aepd.es)."],
        },
        {
          t: "7. Sicherheit",
          p: ["Wir setzen geeignete technische und organisatorische Maßnahmen um: HTTPS-Verschlüsselung aller Kommunikation, Authentifizierung mit JWT-Tokens, mit bcrypt gespeicherte Passwörter, eingeschränkter Datenbankzugriff."],
        },
      ],
    },
    terms: {
      title: "Nutzungsbedingungen",
      sections: [
        {
          t: "1. Gegenstand und Geltungsbereich",
          p: ["CanaryCab ist eine digitale Vermittlungsplattform, die Nutzer, die einen Taxidienst benötigen, mit autorisierten Fahrern auf den Kanarischen Inseln verbindet. CanaryCab ist kein Transportunternehmen; die Fahrer sind selbstständige Berufskraftfahrer mit einer Taxi- oder VTC-Lizenz gemäß der geltenden kanarischen Gesetzgebung."],
        },
        {
          t: "2. Nutzungsvoraussetzungen",
          list: [
            "Mindestens 18 Jahre alt sein oder die Zustimmung eines Erziehungsberechtigten haben.",
            "Bei der Registrierung wahrheitsgemäße Angaben machen.",
            "Für Fahrer: eine gültige Taxi- oder VTC-Lizenz besitzen, ausgestellt von der zuständigen Behörde der Autonomen Gemeinschaft der Kanarischen Inseln.",
          ],
        },
        {
          t: "3. Tarife und Zahlungen",
          p: ["Die in der Anwendung angezeigten Tarife sind **Schätzungen**, berechnet nach den zum Zeitpunkt der Fahrt geltenden offiziellen Tarifen des BOC (Amtsblatt der Kanarischen Inseln). Der endgültige Preis wird durch das geeichte Taxameter des Fahrzeugs bestimmt. CanaryCab wickelt keine Zahlungen ab; die Bezahlung erfolgt direkt an den Fahrer am Ende der Fahrt (bar oder nach Vereinbarung zwischen den Parteien)."],
        },
        {
          t: "4. Stornierungen",
          p: ["Der Kunde kann eine Fahrt stornieren, bis der Fahrer seine Ankunft am Abholpunkt gemeldet hat. Wiederholte oder missbräuchliche Stornierungen können zur vorübergehenden Sperrung des Kontos führen."],
        },
        {
          t: "5. Haftung",
          p: ["CanaryCab handelt ausschließlich als technischer Vermittler. Die Verantwortung für die Erbringung der Transportdienstleistung liegt allein beim autorisierten Fahrer. CanaryCab haftet nicht für Schäden aus der Transportdienstleistung, Verspätungen, Unfälle oder andere Vorfälle während der Fahrt."],
        },
        {
          t: "6. Verbotenes Verhalten",
          list: [
            "Betrügerische Nutzung der Plattform oder Identitätsmissbrauch.",
            "Anfordern von Fahrten ohne Absicht, sie anzutreten.",
            "Beleidigendes oder bedrohliches Verhalten gegenüber anderen Nutzern oder Fahrern.",
            "Reverse Engineering, Scraping oder jede unbefugte Nutzung der API.",
          ],
        },
        {
          t: "7. Geistiges Eigentum",
          p: ["Quellcode, Design, Logos und Inhalte von CanaryCab sind Eigentum ihrer Entwickler und durch spanisches und internationales Urheberrecht geschützt. Die Vervielfältigung ohne schriftliche Genehmigung ist untersagt."],
        },
        {
          t: "8. Änderungen",
          p: ["CanaryCab behält sich das Recht vor, diese Bedingungen jederzeit zu ändern. Wesentliche Änderungen werden registrierten Nutzern mindestens 15 Tage im Voraus per E-Mail mitgeteilt."],
        },
        {
          t: "9. Anwendbares Recht und Gerichtsstand",
          p: ["Diese Bedingungen unterliegen spanischem Recht. Für Streitigkeiten sind die Gerichte von Las Palmas de Gran Canaria zuständig, sofern das Verbraucherrecht keinen anderen Gerichtsstand vorsieht."],
        },
        {
          t: "10. Kontakt",
          p: ["Für alle Anfragen: **legal@canarycab.com**"],
        },
      ],
    },
    cookies: {
      title: "Cookie-Richtlinie",
      sections: [
        {
          t: "Was sind Cookies?",
          p: ["Cookies sind kleine Textdateien, die Websites auf Ihrem Gerät speichern, um Einstellungen zu merken, Sitzungen aktiv zu halten und anonyme Nutzungsdaten zu erfassen."],
        },
        {
          t: "Verwendete Cookies",
          table: {
            headers: ["Name", "Typ", "Zweck", "Dauer"],
            rows: [
              ["taya_token", "Technisch · Sitzung", "Hält die Sitzung des authentifizierten Nutzers aufrecht (JWT).", "Browsersitzung"],
              ["taya:online", "Technisch · Lokal", "Merkt sich, ob der Fahrer beim Schließen der App online war.", "Dauerhaft"],
              ["taya:prefs", "Einstellungen", "Speichert Ton- und Benachrichtigungseinstellungen.", "Dauerhaft"],
            ],
          },
          note: "CanaryCab **verwendet keine Tracking-, Werbe- oder Analyse-Cookies von Drittanbietern**.",
        },
        {
          t: "Lokaler Speicher (sessionStorage / localStorage)",
          p: ["Anstelle klassischer Cookies verwenden wir `sessionStorage` für die Sitzung (wird beim Schließen des Tabs gelöscht) und `localStorage` für dauerhafte Einstellungen. Diese Daten werden niemals automatisch mit jeder Anfrage an den Server gesendet."],
        },
        {
          t: "Verwaltung und Löschung",
          p: ["Sie können alle Cookies und lokalen Daten jederzeit in den Einstellungen Ihres Browsers oder Mobilgeräts löschen. Beim Löschen werden Sie abgemeldet und die Einstellungen zurückgesetzt."],
        },
        {
          t: "Kontakt",
          p: ["Bei Fragen zur Verwendung von Cookies: **privacidad@canarycab.com**"],
        },
      ],
    },
  },
};
