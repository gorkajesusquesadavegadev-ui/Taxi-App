/**
 * Genera las páginas estáticas de contenido (una por idioma) que Google puede
 * indexar y rankear.
 *
 * Por qué existe esto: canarycab.com es una SPA detrás de un login. En el HTML
 * que recibe un buscador solo hay 8 palabras ("CanaryCab · Tu app de taxis de
 * Canarias") — no hay NADA que posicionar. Estas páginas son HTML puro, sin
 * JavaScript, con el contenido que la gente busca de verdad ("tarifa taxi Las
 * Palmas", "precio taxi aeropuerto Gran Canaria") y datos oficiales del BOC.
 *
 * Se generan en el build (prebuild) para que no se queden desincronizadas.
 * IMPORTANTE: las tarifas de aquí deben coincidir con
 * backend/src/main/java/com/taya/service/TarifaService.java (fuente de verdad).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const SALIDA = join(RAIZ, "public");
const SITIO = "https://canarycab.com";

// ── Tarifas oficiales (deben coincidir con TarifaService.java) ───────────────
// Tarifa 1 urbana: BOC nº 174, 3-sep-2025 (Resolución 14-ago-2025)
const T1 = [
  ["diurnoLab", "3,05 €", "0,85 €", "17,00 €"],
  ["diurnoSab", "3,25 €", "0,90 €", "18,00 €"],
  ["diurnoFes", "4,00 €", "1,00 €", "20,00 €"],
  ["nocturnoLunJue", "3,80 €", "0,90 €", "20,00 €"],
  ["nocturnoVieSab", "4,30 €", "1,00 €", "20,00 €"],
  ["nocturnoFes", "4,75 €", "1,00 €", "20,00 €"],
  ["nochebuena", "6,95 €", "1,00 €", "20,00 €"],
];
// Tarifa 3 interurbana: BOC nº 59, 24-mar-2023 (Orden 14-mar-2023)
const T3 = [
  ["t3Lab", "3,85 €", "1,35 €", "18,50 €"],
  ["t3Noc", "4,25 €", "1,55 €", "18,50 €"],
  ["t3Nav", "6,54 €", "1,55 €", "18,50 €"],
];
// Precios reales calculados por el motor de la app (tarifa diurna laborable)
const EJEMPLOS = [
  ["Aeropuerto (LPA) → Las Palmas", "35,10 €"],
  ["Las Palmas → Aeropuerto (LPA)", "34,38 €"],
  ["Las Palmas → Maspalomas", "78,83 €"],
  ["Las Palmas → Puerto Rico", "98,82 €"],
  ["Las Palmas → Puerto de Mogán", "107,74 €"],
];

const IDIOMAS = {
  es: {
    slug: "tarifas-taxi-gran-canaria",
    htmlLang: "es",
    title: "Tarifas de taxi en Gran Canaria 2026 · Precios oficiales BOC | CanaryCab",
    desc: "Tarifas oficiales del taxi en Gran Canaria: bajada de bandera, precio por kilómetro y suplementos según el BOC. Cuánto cuesta el taxi del aeropuerto a Las Palmas, Maspalomas y Mogán.",
    h1: "Tarifas de taxi en Gran Canaria",
    intro:
      "Precios oficiales publicados en el Boletín Oficial de Canarias (BOC). Toda carrera se cobra por taxímetro: se parte de la bajada de bandera y se suma el precio por kilómetro recorrido. CanaryCab calcula el importe con estas mismas tarifas y te lo muestra antes de pedir el taxi.",
    h2Urbana: "Tarifa 1 · Zona urbana de Las Palmas de Gran Canaria",
    urbanaNota:
      "Se aplica cuando el viaje empieza y termina dentro del casco urbano. La bajada de bandera incluye los primeros 500 metros.",
    h2Inter: "Tarifa 3 · Interurbana (aeropuerto, sur, norte y resto de la isla)",
    interNota:
      "Se aplica en cuanto el origen o el destino queda fuera del casco urbano: aeropuerto, Maspalomas, Mogán, Telde, Gáldar… No hay bajada de bandera, sino un mínimo de percepción que ya incluye los primeros 1.500 metros.",
    h2Sup: "Suplementos oficiales",
    h2Ej: "Cuánto cuesta un taxi en Gran Canaria: precios de referencia",
    ejNota:
      "Trayectos habituales calculados con la tarifa diurna de día laborable, suplementos incluidos. El importe real depende del recorrido exacto, de la franja horaria (noche, domingo o festivo salen más caros) y del tráfico.",
    h2Faq: "Preguntas frecuentes",
    cta: "Pedir un taxi en CanaryCab",
    ctaNota: "Ruta real en el mapa, precio antes de pedir y seguimiento del taxi en vivo.",
    colFranja: "Franja horaria",
    colBandera: "Bajada de bandera",
    colMinimo: "Mínimo de percepción",
    colKm: "Precio por km",
    colEspera: "Hora de espera",
    volver: "Ir a CanaryCab",
    fuente: "Fuentes oficiales",
    franjas: {
      diurnoLab: "Laborables de 6:00 a 22:00",
      diurnoSab: "Sábados de 6:00 a 22:00",
      diurnoFes: "Domingos y festivos de 6:00 a 22:00",
      nocturnoLunJue: "Noche de lunes a jueves (22:00–6:00)",
      nocturnoVieSab: "Noche de viernes, sábado y vísperas de festivo",
      nocturnoFes: "Noche de domingos y festivos",
      nochebuena: "Nochebuena (24/12) y Nochevieja (31/12), noche",
      t3Lab: "Laborables de 6:00 a 22:00",
      t3Noc: "Noche (22:00–6:00), domingos y festivos",
      t3Nav: "24 y 31 de diciembre y 5 de enero, de 22:00 en adelante",
    },
    suplementos: [
      ["Radiotaxi (servicio pedido por app o central)", "0,60 €"],
      ["Entrada o salida del muelle — zona urbana", "0,70 €"],
      ["Origen o destino en aeropuerto o puerto — tarifa interurbana", "2,10 €"],
      ["Bultos de más de 50 kg", "0,35 €"],
    ],
    faq: [
      [
        "¿Cuánto cuesta un taxi del aeropuerto de Gran Canaria a Las Palmas?",
        "Unos 35 € en tarifa diurna de día laborable, suplemento de aeropuerto incluido. Por la noche, domingos y festivos sube porque cambia la franja tarifaria. Es un trayecto interurbano (Tarifa 3), no urbano.",
      ],
      [
        "¿Cuánto cuesta el taxi del aeropuerto a Maspalomas o Playa del Inglés?",
        "El aeropuerto está a unos 30 km del sur turístico. Se cobra con la Tarifa 3 interurbana: mínimo de percepción de 3,85 € más 1,35 € por kilómetro en horario diurno de día laborable, más el suplemento de aeropuerto de 2,10 €.",
      ],
      [
        "¿Los taxis de Gran Canaria tienen precio fijo al aeropuerto?",
        "No. La tarifa es por taxímetro según el BOC. En CanaryCab el precio se calcula sobre la ruta real y se te muestra antes de pedir, y ese importe es el que se cobra al terminar.",
      ],
      [
        "¿Es más caro el taxi de noche o en festivo?",
        "Sí. De 22:00 a 6:00 y en domingos y festivos se aplica una franja más cara, tanto en la bajada de bandera como en el precio por kilómetro. Las noches de Nochebuena y Nochevieja tienen tarifa propia.",
      ],
      [
        "¿Qué es el suplemento de radiotaxi?",
        "Son 0,60 € que el BOC fija para los servicios pedidos a través de una central o una app, en lugar de parar el taxi en la calle. Va incluido en el precio que muestra CanaryCab.",
      ],
      [
        "¿Cuántas personas caben en un taxi en Gran Canaria?",
        "Un taxi estándar admite hasta 4 pasajeros, y el precio es por vehículo, no por persona. En CanaryCab también puedes pedir un taxi adaptado para silla de ruedas.",
      ],
    ],
  },
  en: {
    slug: "taxi-fares-gran-canaria",
    htmlLang: "en",
    title: "Taxi fares in Gran Canaria 2026 · Official BOC prices | CanaryCab",
    desc: "Official taxi fares in Gran Canaria: flag drop, price per kilometre and supplements as published in the BOC. How much a taxi from the airport to Las Palmas, Maspalomas and Mogán costs.",
    h1: "Taxi fares in Gran Canaria",
    intro:
      "Official prices published in the Canary Islands Official Gazette (BOC). Every ride is metered: it starts from the flag drop and adds the price per kilometre travelled. CanaryCab uses these exact fares and shows you the amount before you book.",
    h2Urbana: "Tariff 1 · Urban area of Las Palmas de Gran Canaria",
    urbanaNota:
      "Applies when the trip starts and ends inside the city. The flag drop covers the first 500 metres.",
    h2Inter: "Tariff 3 · Interurban (airport, south, north and the rest of the island)",
    interNota:
      "Applies as soon as the pick-up or drop-off is outside the city: airport, Maspalomas, Mogán, Telde, Gáldar… There is no flag drop, but a minimum charge that already covers the first 1,500 metres.",
    h2Sup: "Official supplements",
    h2Ej: "How much a taxi costs in Gran Canaria: reference prices",
    ejNota:
      "Common routes calculated with the weekday daytime tariff, supplements included. The final amount depends on the exact route, the time band (nights, Sundays and public holidays cost more) and traffic.",
    h2Faq: "Frequently asked questions",
    cta: "Book a taxi with CanaryCab",
    ctaNota: "Real route on the map, price before you book and live taxi tracking.",
    colFranja: "Time band",
    colBandera: "Flag drop",
    colMinimo: "Minimum charge",
    colKm: "Price per km",
    colEspera: "Waiting hour",
    volver: "Go to CanaryCab",
    fuente: "Official sources",
    franjas: {
      diurnoLab: "Weekdays 6:00–22:00",
      diurnoSab: "Saturdays 6:00–22:00",
      diurnoFes: "Sundays and public holidays 6:00–22:00",
      nocturnoLunJue: "Monday to Thursday nights (22:00–6:00)",
      nocturnoVieSab: "Friday, Saturday and holiday-eve nights",
      nocturnoFes: "Sunday and public holiday nights",
      nochebuena: "Christmas Eve (24/12) and New Year's Eve (31/12), night",
      t3Lab: "Weekdays 6:00–22:00",
      t3Noc: "Nights (22:00–6:00), Sundays and public holidays",
      t3Nav: "24 and 31 December and 5 January, from 22:00",
    },
    suplementos: [
      ["Radio taxi (booked through an app or dispatch centre)", "€0.60"],
      ["Port entry or exit — urban area", "€0.70"],
      ["Pick-up or drop-off at an airport or port — interurban tariff", "€2.10"],
      ["Luggage over 50 kg", "€0.35"],
    ],
    faq: [
      [
        "How much is a taxi from Gran Canaria airport to Las Palmas?",
        "Around €35 on the weekday daytime tariff, airport supplement included. At night, on Sundays and on public holidays it costs more because the time band changes. It is an interurban trip (Tariff 3), not an urban one.",
      ],
      [
        "How much is a taxi from the airport to Maspalomas or Playa del Inglés?",
        "The airport is about 30 km from the southern resorts. It is charged on the interurban Tariff 3: a €3.85 minimum charge plus €1.35 per kilometre on the weekday daytime band, plus the €2.10 airport supplement.",
      ],
      [
        "Do taxis in Gran Canaria have a fixed airport price?",
        "No. Fares are metered according to the BOC. With CanaryCab the price is calculated on the real route and shown before you book, and that is the amount charged at the end.",
      ],
      [
        "Are taxis more expensive at night or on public holidays?",
        "Yes. From 22:00 to 6:00 and on Sundays and public holidays a more expensive band applies, both to the flag drop and to the price per kilometre. Christmas Eve and New Year's Eve nights have their own tariff.",
      ],
      [
        "What is the radio taxi supplement?",
        "It is €0.60 set by the BOC for rides booked through a dispatch centre or an app instead of hailing a taxi in the street. It is already included in the price CanaryCab shows.",
      ],
      [
        "How many people fit in a taxi in Gran Canaria?",
        "A standard taxi takes up to 4 passengers, and the price is per vehicle, not per person. With CanaryCab you can also request a wheelchair-accessible taxi.",
      ],
    ],
  },
  de: {
    slug: "taxitarife-gran-canaria",
    htmlLang: "de",
    title: "Taxitarife auf Gran Canaria 2026 · Offizielle BOC-Preise | CanaryCab",
    desc: "Offizielle Taxitarife auf Gran Canaria: Grundgebühr, Kilometerpreis und Zuschläge laut BOC. Was das Taxi vom Flughafen nach Las Palmas, Maspalomas und Mogán kostet.",
    h1: "Taxitarife auf Gran Canaria",
    intro:
      "Offizielle Preise aus dem Amtsblatt der Kanaren (BOC). Jede Fahrt läuft über das Taxameter: Es beginnt mit der Grundgebühr, dazu kommt der Preis pro gefahrenem Kilometer. CanaryCab rechnet mit genau diesen Tarifen und zeigt den Betrag vor der Bestellung an.",
    h2Urbana: "Tarif 1 · Stadtgebiet von Las Palmas de Gran Canaria",
    urbanaNota:
      "Gilt, wenn die Fahrt innerhalb der Stadt beginnt und endet. Die Grundgebühr enthält die ersten 500 Meter.",
    h2Inter: "Tarif 3 · Überland (Flughafen, Süden, Norden und restliche Insel)",
    interNota:
      "Gilt, sobald Start oder Ziel außerhalb der Stadt liegt: Flughafen, Maspalomas, Mogán, Telde, Gáldar… Es gibt keine Grundgebühr, sondern ein Mindestentgelt, das bereits die ersten 1.500 Meter enthält.",
    h2Sup: "Offizielle Zuschläge",
    h2Ej: "Was ein Taxi auf Gran Canaria kostet: Richtpreise",
    ejNota:
      "Übliche Strecken, berechnet mit dem Tagestarif an Werktagen, Zuschläge inklusive. Der tatsächliche Betrag hängt von der genauen Strecke, der Tageszeit (nachts, sonntags und an Feiertagen teurer) und vom Verkehr ab.",
    h2Faq: "Häufige Fragen",
    cta: "Taxi mit CanaryCab bestellen",
    ctaNota: "Echte Route auf der Karte, Preis vor der Bestellung und Live-Verfolgung des Taxis.",
    colFranja: "Zeitfenster",
    colBandera: "Grundgebühr",
    colMinimo: "Mindestentgelt",
    colKm: "Preis pro km",
    colEspera: "Wartestunde",
    volver: "Zu CanaryCab",
    fuente: "Offizielle Quellen",
    franjas: {
      diurnoLab: "Werktags 6:00–22:00",
      diurnoSab: "Samstags 6:00–22:00",
      diurnoFes: "Sonn- und Feiertags 6:00–22:00",
      nocturnoLunJue: "Nächte Montag bis Donnerstag (22:00–6:00)",
      nocturnoVieSab: "Nächte Freitag, Samstag und vor Feiertagen",
      nocturnoFes: "Nächte an Sonn- und Feiertagen",
      nochebuena: "Heiligabend (24.12.) und Silvester (31.12.), nachts",
      t3Lab: "Werktags 6:00–22:00",
      t3Noc: "Nachts (22:00–6:00), sonn- und feiertags",
      t3Nav: "24. und 31. Dezember und 5. Januar, ab 22:00",
    },
    suplementos: [
      ["Funktaxi (Bestellung über App oder Zentrale)", "0,60 €"],
      ["Hafenzufahrt oder -ausfahrt — Stadtgebiet", "0,70 €"],
      ["Start oder Ziel an Flughafen oder Hafen — Überlandtarif", "2,10 €"],
      ["Gepäck über 50 kg", "0,35 €"],
    ],
    faq: [
      [
        "Was kostet ein Taxi vom Flughafen Gran Canaria nach Las Palmas?",
        "Rund 35 € zum Tagestarif an Werktagen, inklusive Flughafenzuschlag. Nachts, sonntags und an Feiertagen wird es teurer, weil ein anderes Zeitfenster gilt. Es ist eine Überlandfahrt (Tarif 3), keine Stadtfahrt.",
      ],
      [
        "Was kostet das Taxi vom Flughafen nach Maspalomas oder Playa del Inglés?",
        "Der Flughafen liegt etwa 30 km von den südlichen Urlaubsorten entfernt. Abgerechnet wird nach dem Überlandtarif 3: 3,85 € Mindestentgelt plus 1,35 € pro Kilometer im Tagesfenster an Werktagen, dazu 2,10 € Flughafenzuschlag.",
      ],
      [
        "Haben Taxis auf Gran Canaria einen Festpreis zum Flughafen?",
        "Nein. Abgerechnet wird per Taxameter nach BOC. Bei CanaryCab wird der Preis auf der echten Route berechnet und vor der Bestellung angezeigt — dieser Betrag wird am Ende auch berechnet.",
      ],
      [
        "Ist das Taxi nachts oder an Feiertagen teurer?",
        "Ja. Von 22:00 bis 6:00 sowie sonn- und feiertags gilt ein teureres Fenster, sowohl bei der Grundgebühr als auch beim Kilometerpreis. Die Nächte an Heiligabend und Silvester haben einen eigenen Tarif.",
      ],
      [
        "Was ist der Funktaxi-Zuschlag?",
        "0,60 €, die das BOC für Fahrten festlegt, die über eine Zentrale oder App bestellt werden, statt ein Taxi auf der Straße anzuhalten. Er ist im angezeigten Preis von CanaryCab bereits enthalten.",
      ],
      [
        "Wie viele Personen passen in ein Taxi auf Gran Canaria?",
        "Ein Standardtaxi nimmt bis zu 4 Fahrgäste mit, und der Preis gilt pro Fahrzeug, nicht pro Person. Bei CanaryCab kann auch ein rollstuhlgerechtes Taxi angefordert werden.",
      ],
    ],
  },
};

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function filasT1(L) {
  return T1.map(
    ([k, bandera, km, espera]) =>
      `<tr><th scope="row">${esc(L.franjas[k])}</th><td>${bandera}</td><td>${km}</td><td>${espera}</td></tr>`
  ).join("\n");
}
function filasT3(L) {
  return T3.map(
    ([k, minimo, km, espera]) =>
      `<tr><th scope="row">${esc(L.franjas[k])}</th><td>${minimo}</td><td>${km}</td><td>${espera}</td></tr>`
  ).join("\n");
}

function paginaHtml(codigo, L) {
  const url = `${SITIO}/${L.slug}`;
  const alternates = Object.entries(IDIOMAS)
    .map(([c, o]) => `    <link rel="alternate" hreflang="${c}" href="${SITIO}/${o.slug}" />`)
    .join("\n");

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TaxiService",
        name: "CanaryCab",
        url: SITIO,
        description: L.desc,
        areaServed: [
          "Gran Canaria", "Tenerife", "Lanzarote", "Fuerteventura",
          "La Palma", "La Gomera", "El Hierro",
        ].map((n) => ({ "@type": "Place", name: n })),
        provider: { "@type": "Organization", name: "CanaryCab", url: SITIO },
        availableChannel: {
          "@type": "ServiceChannel",
          serviceUrl: SITIO,
          availableLanguage: ["es", "en", "de"],
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: L.faq.map(([q, a]) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "CanaryCab", item: SITIO },
          { "@type": "ListItem", position: 2, name: L.h1, item: url },
        ],
      },
    ],
  };

  return `<!doctype html>
<html lang="${L.htmlLang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#0B2E4F" />
    <title>${esc(L.title)}</title>
    <meta name="description" content="${esc(L.desc)}" />
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
    <link rel="canonical" href="${url}" />
${alternates}
    <link rel="alternate" hreflang="x-default" href="${SITIO}/${IDIOMAS.es.slug}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${esc(L.title)}" />
    <meta property="og:description" content="${esc(L.desc)}" />
    <meta property="og:image" content="${SITIO}/icons/pwa-512.png" />
    <meta property="og:site_name" content="CanaryCab" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
    <style>
      :root { --volcanic:#0B2E4F; --taxi:#FFC400; --cream:#F7FBFE; --sand:#EFE7D6; --sand-deep:#DCCFB4; }
      * { box-sizing: border-box; }
      body { margin:0; background:var(--cream); color:var(--volcanic);
        font: 16px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; }
      .wrap { max-width: 56rem; margin: 0 auto; padding: 0 1.25rem 4rem; }
      header.hero { background:var(--volcanic); color:var(--cream); padding:2.5rem 0 2.25rem; }
      header.hero .wrap { padding-bottom:0; }
      .marca { font-weight:900; letter-spacing:-.5px; font-size:1.35rem; color:var(--taxi);
        text-decoration:none; display:inline-block; }
      h1 { font-size: clamp(1.8rem, 5vw, 2.6rem); line-height:1.15; margin:.9rem 0 .6rem; letter-spacing:-.5px; }
      header.hero p { margin:0; color:#F7FBFEc0; max-width:44rem; }
      h2 { font-size: clamp(1.25rem, 3.2vw, 1.6rem); margin:2.5rem 0 .35rem; letter-spacing:-.3px; }
      h3 { font-size:1.02rem; margin:1.4rem 0 .3rem; }
      .nota { color:#0B2E4Fa0; margin:.2rem 0 1rem; font-size:.95rem; }
      .tabla-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch;
        border:1px solid var(--sand-deep); border-radius:14px; background:#fff; }
      table { border-collapse:collapse; width:100%; min-width:34rem; }
      caption { text-align:left; padding:.75rem 1rem 0; font-weight:700; font-size:.9rem; color:#0B2E4Fa0; }
      th, td { padding:.7rem 1rem; text-align:left; border-bottom:1px solid var(--sand); font-size:.95rem; }
      thead th { background:var(--sand); font-size:.78rem; text-transform:uppercase;
        letter-spacing:.06em; color:#0B2E4Fb0; }
      tbody th { font-weight:600; }
      tbody tr:last-child th, tbody tr:last-child td { border-bottom:0; }
      td { font-variant-numeric: tabular-nums; }
      .cta { display:inline-block; margin-top:1rem; background:var(--taxi); color:var(--volcanic);
        font-weight:800; padding:.85rem 1.6rem; border-radius:999px; text-decoration:none; }
      .cta-box { margin-top:2.5rem; background:#fff; border:1px solid var(--sand-deep);
        border-radius:18px; padding:1.5rem; }
      details { background:#fff; border:1px solid var(--sand-deep); border-radius:12px;
        padding:.85rem 1.1rem; margin-bottom:.6rem; }
      summary { cursor:pointer; font-weight:700; }
      details p { margin:.6rem 0 0; color:#0B2E4Fc0; }
      footer { margin-top:3rem; padding-top:1.5rem; border-top:1px solid var(--sand-deep);
        font-size:.85rem; color:#0B2E4F99; }
      footer a { color:inherit; }
      .idiomas { margin-top:.75rem; font-size:.85rem; }
      .idiomas a { color:var(--taxi); text-decoration:none; font-weight:700; margin-right:.9rem; }
    </style>
  </head>
  <body>
    <header class="hero">
      <div class="wrap">
        <a class="marca" href="/">CanaryCab</a>
        <h1>${esc(L.h1)}</h1>
        <p>${esc(L.intro)}</p>
        <p class="idiomas">${Object.entries(IDIOMAS)
          .filter(([c]) => c !== codigo)
          .map(([c, o]) => `<a href="/${o.slug}">${c.toUpperCase()}</a>`)
          .join("")}</p>
      </div>
    </header>

    <main class="wrap">
      <h2>${esc(L.h2Urbana)}</h2>
      <p class="nota">${esc(L.urbanaNota)}</p>
      <div class="tabla-scroll">
        <table>
          <thead><tr><th>${esc(L.colFranja)}</th><th>${esc(L.colBandera)}</th><th>${esc(L.colKm)}</th><th>${esc(L.colEspera)}</th></tr></thead>
          <tbody>
${filasT1(L)}
          </tbody>
        </table>
      </div>

      <h2>${esc(L.h2Inter)}</h2>
      <p class="nota">${esc(L.interNota)}</p>
      <div class="tabla-scroll">
        <table>
          <thead><tr><th>${esc(L.colFranja)}</th><th>${esc(L.colMinimo)}</th><th>${esc(L.colKm)}</th><th>${esc(L.colEspera)}</th></tr></thead>
          <tbody>
${filasT3(L)}
          </tbody>
        </table>
      </div>

      <h2>${esc(L.h2Sup)}</h2>
      <div class="tabla-scroll">
        <table>
          <tbody>
${L.suplementos.map(([n, v]) => `            <tr><th scope="row">${esc(n)}</th><td>${v}</td></tr>`).join("\n")}
          </tbody>
        </table>
      </div>

      <h2>${esc(L.h2Ej)}</h2>
      <p class="nota">${esc(L.ejNota)}</p>
      <div class="tabla-scroll">
        <table>
          <tbody>
${EJEMPLOS.map(([n, v]) => `            <tr><th scope="row">${esc(n)}</th><td>${v}</td></tr>`).join("\n")}
          </tbody>
        </table>
      </div>

      <h2>${esc(L.h2Faq)}</h2>
${L.faq.map(([q, a]) => `      <details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("\n")}

      <div class="cta-box">
        <h3 style="margin-top:0">${esc(L.cta)}</h3>
        <p class="nota" style="margin-bottom:0">${esc(L.ctaNota)}</p>
        <a class="cta" href="/">${esc(L.volver)}</a>
      </div>

      <footer>
        <p><strong>${esc(L.fuente)}:</strong>
          <a href="https://www.gobiernodecanarias.org/boc/2025/174/3151.html" rel="nofollow noopener" target="_blank">BOC nº 174 (2025)</a> ·
          <a href="https://sede.gobiernodecanarias.org/boc/boc-a-2023-059-868.pdf" rel="nofollow noopener" target="_blank">BOC nº 59 (2023)</a>
        </p>
        <p>© CanaryCab · <a href="/privacidad">Privacidad</a> · <a href="/cookies">Cookies</a> · <a href="/terminos">Términos</a></p>
      </footer>
    </main>
  </body>
</html>
`;
}

// ── Escribir páginas ────────────────────────────────────────────────────────
mkdirSync(SALIDA, { recursive: true });
for (const [codigo, L] of Object.entries(IDIOMAS)) {
  writeFileSync(join(SALIDA, `${L.slug}.html`), paginaHtml(codigo, L), "utf8");
  console.log(`  ✔ ${L.slug}.html`);
}

// ── Sitemap (incluye las páginas de contenido y sus alternativas de idioma) ──
const hoy = new Date().toISOString().slice(0, 10);
const alternatesXml = Object.entries(IDIOMAS)
  .map(([c, o]) => `      <xhtml:link rel="alternate" hreflang="${c}" href="${SITIO}/${o.slug}"/>`)
  .join("\n");

const urls = [
  `  <url>\n    <loc>${SITIO}/</loc>\n    <lastmod>${hoy}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>`,
  ...Object.values(IDIOMAS).map(
    (o) =>
      `  <url>\n    <loc>${SITIO}/${o.slug}</loc>\n    <lastmod>${hoy}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.9</priority>\n${alternatesXml}\n  </url>`
  ),
  ...["privacidad", "cookies", "terminos"].map(
    (p) =>
      `  <url>\n    <loc>${SITIO}/${p}</loc>\n    <lastmod>${hoy}</lastmod>\n    <changefreq>yearly</changefreq>\n    <priority>0.3</priority>\n  </url>`
  ),
].join("\n");

writeFileSync(
  join(SALIDA, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`,
  "utf8"
);
console.log("  ✔ sitemap.xml");
