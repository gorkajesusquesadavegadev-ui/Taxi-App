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
// Los textos legales se leen del mismo módulo que usa la app, no de una copia:
// dos versiones del mismo documento acabarían diciendo cosas distintas.
import { LEGAL } from "../src/i18n/legal.js";
import { DICT } from "../src/i18n/dict.js";

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
// ── Trayectos con página propia ─────────────────────────────────────────────
// km y minutos son los que devuelve el motor de rutas real de la app (OSRM);
// los precios se calculan aquí con las MISMAS fórmulas que TarifaService para
// que no puedan divergir de lo que luego cobra la app:
//   Tarifa 3 día   = 3,85 € (incluye 1.500 m) + 1,35 €/km + suplementos
//   Tarifa 3 noche = 4,25 € (incluye 1.500 m) + 1,55 €/km + suplementos
//   suplementos    = radiotaxi 0,60 € + aeropuerto/puerto 2,10 € (si aplica)
const SUP_RADIOTAXI = 0.6;
const SUP_AEROPUERTO = 2.1;

function precioT3(km, { noche = false, aeropuerto = true } = {}) {
  const minimo = noche ? 4.25 : 3.85;
  const porKm = noche ? 1.55 : 1.35;
  const sup = SUP_RADIOTAXI + (aeropuerto ? SUP_AEROPUERTO : 0);
  return minimo + porKm * Math.max(0, km - 1.5) + sup;
}
const eur = (n) => n.toFixed(2).replace(".", ",") + " €";

const RUTAS = [
  { id: "aeropuerto-las-palmas", km: 25.9, min: 26, aeropuerto: true,
    slugs: { es: "taxi-aeropuerto-las-palmas", en: "taxi-airport-las-palmas", de: "taxi-flughafen-las-palmas" } },
  { id: "aeropuerto-maspalomas", km: 33.5, min: 27, aeropuerto: true,
    slugs: { es: "taxi-aeropuerto-maspalomas", en: "taxi-airport-maspalomas", de: "taxi-flughafen-maspalomas" } },
  { id: "aeropuerto-puerto-rico", km: 48.3, min: 39, aeropuerto: true,
    slugs: { es: "taxi-aeropuerto-puerto-rico", en: "taxi-airport-puerto-rico", de: "taxi-flughafen-puerto-rico" } },
  { id: "aeropuerto-mogan", km: 54.9, min: 46, aeropuerto: true,
    slugs: { es: "taxi-aeropuerto-puerto-mogan", en: "taxi-airport-puerto-mogan", de: "taxi-flughafen-puerto-mogan" } },
  { id: "las-palmas-maspalomas", km: 56.6, min: 46, aeropuerto: false,
    slugs: { es: "taxi-las-palmas-maspalomas", en: "taxi-las-palmas-maspalomas-en", de: "taxi-las-palmas-maspalomas-de" } },
];

// Precios de referencia para la guía general (tarifa diurna laborable)
const EJEMPLOS = RUTAS.map((r) => [r.id, eur(precioT3(r.km, { aeropuerto: r.aeropuerto }))]);

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
    h2Muni: "Qué tarifa se aplica en cada municipio",
    muniIntro: "La licencia del taxi es municipal y la tarifa la marca el municipio donde EMPIEZA el viaje. Estos son los municipios que cubre CanaryCab hoy:",
    muniCol1: "Municipio de origen",
    muniCol2: "Tarifa aplicada",
    muni: [
      ["Las Palmas de Gran Canaria (dentro del casco)", "Tarifa 1 urbana — más barata por km, con recargo de noche, sábados y festivos. Bajada de bandera incluye 500 m."],
      ["San Bartolomé de Tirajana (Maspalomas, Playa del Inglés, San Agustín, El Tablero…)", "Tarifa 3 interurbana — no tiene tarifa urbana propia. Precio único las 24 horas. Mínimo incluye 1.500 m."],
      ["Entre municipios, al aeropuerto o resto de la isla", "Tarifa 3 interurbana."],
    ],
    muniNota: "La tarifa depende de dónde SALE el viaje, no del taxista. Un conductor de un municipio no puede coger un servicio que arranca en otro: es una obligación de la licencia municipal del taxi.",
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
    h2Muni: "Which tariff applies in each municipality",
    muniIntro: "Taxi licences are municipal, and the tariff is set by the municipality where the trip STARTS. These are the municipalities CanaryCab covers today:",
    muniCol1: "Municipality of origin",
    muniCol2: "Tariff applied",
    muni: [
      ["Las Palmas de Gran Canaria (within the city)", "Urban Tariff 1 — cheaper per km, with a night, Saturday and holiday surcharge. Flag drop includes 500 m."],
      ["San Bartolomé de Tirajana (Maspalomas, Playa del Inglés, San Agustín, El Tablero…)", "Interurban Tariff 3 — no urban tariff of its own. Single price, 24 hours. Minimum includes 1,500 m."],
      ["Between municipalities, to the airport or the rest of the island", "Interurban Tariff 3."],
    ],
    muniNota: "The tariff depends on where the trip STARTS, not on the driver. A driver from one municipality cannot take a ride starting in another: it is an obligation of the municipal taxi licence.",
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
    h2Muni: "Welcher Tarif in welcher Gemeinde gilt",
    muniIntro: "Die Taxilizenz ist gemeindegebunden; der Tarif richtet sich nach der Gemeinde, in der die Fahrt BEGINNT. Diese Gemeinden deckt CanaryCab derzeit ab:",
    muniCol1: "Startgemeinde",
    muniCol2: "Angewendeter Tarif",
    muni: [
      ["Las Palmas de Gran Canaria (im Stadtgebiet)", "Städtischer Tarif 1 — günstiger pro km, mit Zuschlag nachts, samstags und an Feiertagen. Grundgebühr enthält 500 m."],
      ["San Bartolomé de Tirajana (Maspalomas, Playa del Inglés, San Agustín, El Tablero…)", "Überörtlicher Tarif 3 — kein eigener Stadttarif. Einheitspreis, 24 Stunden. Mindestbetrag enthält 1.500 m."],
      ["Zwischen Gemeinden, zum Flughafen oder in den Rest der Insel", "Überörtlicher Tarif 3."],
    ],
    muniNota: "Der Tarif hängt davon ab, wo die Fahrt BEGINNT, nicht vom Fahrer. Ein Fahrer aus einer Gemeinde darf keine Fahrt übernehmen, die in einer anderen beginnt: Das ist eine Pflicht der gemeindlichen Taxilizenz.",
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

// Texto propio de cada trayecto. Cada página tiene contenido distinto de verdad
// (destino, qué esperar al llegar, equipaje, franja nocturna): páginas clonadas
// cambiando solo el nombre son "doorway pages" y Google las penaliza.
const RUTAS_TEXTO = {
  es: {
    etiquetas: { dia: "Tarifa diurna (laborables 6:00–22:00)", noche: "Tarifa nocturna, domingos y festivos",
      km: "Distancia por carretera", min: "Duración aproximada", que: "Qué debes saber", otras: "Otros trayectos" },
    "aeropuerto-las-palmas": {
      nombre: "Aeropuerto → Las Palmas",
      h1: "Taxi del aeropuerto de Gran Canaria a Las Palmas",
      title: "Taxi aeropuerto Gran Canaria → Las Palmas · Precio y duración | CanaryCab",
      desc: "Cuánto cuesta el taxi del aeropuerto de Gran Canaria (LPA) a Las Palmas: precio con tarifa oficial del BOC, duración y qué esperar al llegar.",
      intro: "El trayecto entre el aeropuerto de Gran Canaria (LPA) y la capital se hace por la autopista GC-1 y es el más habitual de la isla. Se cobra con la tarifa interurbana oficial (Tarifa 3) más el suplemento de aeropuerto.",
      practico: [
        "La parada de taxis está a la salida de la terminal de llegadas, a pie, sin necesidad de coger lanzadera.",
        "El precio es por vehículo, no por persona: hasta 4 pasajeros pagan lo mismo.",
        "De 22:00 a 6:00 y en domingos y festivos se aplica la franja nocturna, más cara.",
        "Si llegas con vuelo retrasado, en CanaryCab puedes pedir el taxi al recoger el equipaje y ver cuánto tarda en llegar.",
      ],
    },
    "aeropuerto-maspalomas": {
      nombre: "Aeropuerto → Maspalomas",
      h1: "Taxi del aeropuerto de Gran Canaria a Maspalomas y Playa del Inglés",
      title: "Taxi aeropuerto Gran Canaria → Maspalomas · Precio real | CanaryCab",
      desc: "Precio del taxi del aeropuerto de Gran Canaria (LPA) a Maspalomas y Playa del Inglés con la tarifa oficial del BOC, duración del trayecto e información práctica.",
      intro: "Maspalomas y Playa del Inglés son el destino turístico principal del sur de Gran Canaria. Desde el aeropuerto se llega por la GC-1 en menos de media hora, y se cobra con la tarifa interurbana oficial más el suplemento de aeropuerto.",
      practico: [
        "El taxi te deja en la puerta del hotel o apartamento, sin paradas intermedias como en los traslados compartidos.",
        "Precio por vehículo hasta 4 pasajeros: para una familia suele salir mejor que el traslado por persona.",
        "Si tu vuelo aterriza de noche, se aplica la franja nocturna: cuenta con unos euros más.",
        "Puedes pedir taxi adaptado para silla de ruedas desde la propia app.",
      ],
    },
    "aeropuerto-puerto-rico": {
      nombre: "Aeropuerto → Puerto Rico",
      h1: "Taxi del aeropuerto de Gran Canaria a Puerto Rico",
      title: "Taxi aeropuerto Gran Canaria → Puerto Rico · Cuánto cuesta | CanaryCab",
      desc: "Cuánto cuesta un taxi del aeropuerto de Gran Canaria (LPA) a Puerto Rico: precio con tarifa oficial, tiempo de trayecto y consejos prácticos.",
      intro: "Puerto Rico de Gran Canaria está en el suroeste de la isla, pasado Maspalomas. El trayecto desde el aeropuerto continúa por la GC-1 y ronda los tres cuartos de hora, con tarifa interurbana oficial más suplemento de aeropuerto.",
      practico: [
        "Es un trayecto largo: conviene confirmar el precio estimado antes de salir, como muestra CanaryCab al pedirlo.",
        "La zona es de fuerte pendiente y calles estrechas; indica bien el complejo o apartamento al pedir el taxi.",
        "Hasta 4 pasajeros con equipaje entran en un taxi estándar.",
        "En temporada alta y con vuelos nocturnos hay menos taxis libres: pedirlo con antelación ayuda.",
      ],
    },
    "aeropuerto-mogan": {
      nombre: "Aeropuerto → Puerto de Mogán",
      h1: "Taxi del aeropuerto de Gran Canaria a Puerto de Mogán",
      title: "Taxi aeropuerto Gran Canaria → Puerto de Mogán · Precio | CanaryCab",
      desc: "Precio y duración del taxi del aeropuerto de Gran Canaria (LPA) a Puerto de Mogán, con la tarifa interurbana oficial del BOC.",
      intro: "Puerto de Mogán, la llamada «pequeña Venecia», está en el extremo suroeste de Gran Canaria. Es el trayecto más largo desde el aeropuerto entre los destinos turísticos habituales, con tarifa interurbana oficial más suplemento de aeropuerto.",
      practico: [
        "Casi una hora de viaje: es el traslado más caro de los habituales, y el precio se dispara si lo tomas de noche.",
        "El precio es por taxi, no por persona: repartido entre 3 o 4 viajeros resulta competitivo.",
        "Avisa si llevas maletas voluminosas o material deportivo para que envíen un vehículo adecuado.",
        "En CanaryCab ves la ruta real en el mapa y el precio antes de confirmar.",
      ],
    },
    "las-palmas-maspalomas": {
      nombre: "Las Palmas → Maspalomas",
      h1: "Taxi de Las Palmas a Maspalomas",
      title: "Taxi Las Palmas → Maspalomas · Precio y duración | CanaryCab",
      desc: "Cuánto cuesta el taxi de Las Palmas de Gran Canaria a Maspalomas: precio con tarifa interurbana oficial, duración y alternativas.",
      intro: "De la capital al sur turístico hay algo más de 50 km por la autopista GC-1. Al salir del casco urbano se aplica la tarifa interurbana oficial (Tarifa 3); no lleva suplemento de aeropuerto, solo el de radiotaxi.",
      practico: [
        "Es un trayecto de casi una hora: el taxi compensa sobre todo repartido entre varias personas o con equipaje.",
        "La tarifa cambia al cruzar las 22:00 y en domingos y festivos.",
        "Precio por vehículo hasta 4 pasajeros.",
        "CanaryCab calcula el importe sobre la ruta real y lo deja cerrado al pedir el viaje.",
      ],
    },
  },
  en: {
    etiquetas: { dia: "Daytime fare (weekdays 6:00–22:00)", noche: "Night, Sunday and public holiday fare",
      km: "Road distance", min: "Approximate duration", que: "What you should know", otras: "Other routes" },
    "aeropuerto-las-palmas": {
      nombre: "Airport → Las Palmas",
      h1: "Taxi from Gran Canaria airport to Las Palmas",
      title: "Taxi Gran Canaria airport → Las Palmas · Price and duration | CanaryCab",
      desc: "How much a taxi from Gran Canaria airport (LPA) to Las Palmas costs: price under the official BOC fare, duration and what to expect on arrival.",
      intro: "The ride between Gran Canaria airport (LPA) and the capital runs along the GC-1 motorway and is the most common on the island. It is charged under the official interurban fare (Tariff 3) plus the airport supplement.",
      practico: [
        "The taxi rank is right outside the arrivals terminal, on foot — no shuttle needed.",
        "The price is per vehicle, not per person: up to 4 passengers pay the same.",
        "From 22:00 to 6:00 and on Sundays and public holidays the more expensive night band applies.",
        "If your flight is delayed, with CanaryCab you can book the taxi at baggage reclaim and watch it arrive.",
      ],
    },
    "aeropuerto-maspalomas": {
      nombre: "Airport → Maspalomas",
      h1: "Taxi from Gran Canaria airport to Maspalomas and Playa del Inglés",
      title: "Taxi Gran Canaria airport → Maspalomas · Real price | CanaryCab",
      desc: "Taxi price from Gran Canaria airport (LPA) to Maspalomas and Playa del Inglés under the official BOC fare, journey time and practical information.",
      intro: "Maspalomas and Playa del Inglés are the main tourist destination in the south of Gran Canaria. From the airport it takes under half an hour on the GC-1, charged under the official interurban fare plus the airport supplement.",
      practico: [
        "The taxi drops you at your hotel or apartment door, with no intermediate stops unlike shared transfers.",
        "Price is per vehicle for up to 4 passengers: for a family it usually beats per-person transfers.",
        "If your flight lands at night, the night band applies — expect a few euros more.",
        "You can request a wheelchair-accessible taxi from the app itself.",
      ],
    },
    "aeropuerto-puerto-rico": {
      nombre: "Airport → Puerto Rico",
      h1: "Taxi from Gran Canaria airport to Puerto Rico",
      title: "Taxi Gran Canaria airport → Puerto Rico · How much it costs | CanaryCab",
      desc: "How much a taxi from Gran Canaria airport (LPA) to Puerto Rico costs: official fare price, journey time and practical tips.",
      intro: "Puerto Rico de Gran Canaria sits in the south-west of the island, beyond Maspalomas. The ride from the airport continues along the GC-1 and takes around three quarters of an hour, under the official interurban fare plus the airport supplement.",
      practico: [
        "It is a long ride: worth confirming the estimated price before setting off, as CanaryCab shows when you book.",
        "The area is steep with narrow streets — state your complex or apartment clearly when booking.",
        "Up to 4 passengers with luggage fit in a standard taxi.",
        "In high season and on night flights fewer taxis are free: booking ahead helps.",
      ],
    },
    "aeropuerto-mogan": {
      nombre: "Airport → Puerto de Mogán",
      h1: "Taxi from Gran Canaria airport to Puerto de Mogán",
      title: "Taxi Gran Canaria airport → Puerto de Mogán · Price | CanaryCab",
      desc: "Price and duration of a taxi from Gran Canaria airport (LPA) to Puerto de Mogán under the official interurban BOC fare.",
      intro: "Puerto de Mogán, known as 'little Venice', lies at the far south-west of Gran Canaria. It is the longest of the usual airport transfers, charged under the official interurban fare plus the airport supplement.",
      practico: [
        "Almost an hour on the road: the priciest of the usual transfers, and noticeably more at night.",
        "The price is per taxi, not per person — split between 3 or 4 travellers it is competitive.",
        "Mention bulky suitcases or sports equipment so a suitable vehicle is sent.",
        "With CanaryCab you see the real route on the map and the price before confirming.",
      ],
    },
    "las-palmas-maspalomas": {
      nombre: "Las Palmas → Maspalomas",
      h1: "Taxi from Las Palmas to Maspalomas",
      title: "Taxi Las Palmas → Maspalomas · Price and duration | CanaryCab",
      desc: "How much a taxi from Las Palmas de Gran Canaria to Maspalomas costs: official interurban fare price, duration and alternatives.",
      intro: "From the capital to the southern resorts it is just over 50 km along the GC-1 motorway. Once outside the city the official interurban fare (Tariff 3) applies; there is no airport supplement, only the radio-taxi one.",
      practico: [
        "Almost an hour's ride: a taxi pays off mainly when shared between several people or with luggage.",
        "The fare changes after 22:00 and on Sundays and public holidays.",
        "Price per vehicle for up to 4 passengers.",
        "CanaryCab calculates the amount on the real route and locks it in when you book.",
      ],
    },
  },
  de: {
    etiquetas: { dia: "Tagestarif (werktags 6:00–22:00)", noche: "Nacht-, Sonn- und Feiertagstarif",
      km: "Straßenentfernung", min: "Ungefähre Dauer", que: "Was Sie wissen sollten", otras: "Weitere Strecken" },
    "aeropuerto-las-palmas": {
      nombre: "Flughafen → Las Palmas",
      h1: "Taxi vom Flughafen Gran Canaria nach Las Palmas",
      title: "Taxi Flughafen Gran Canaria → Las Palmas · Preis und Dauer | CanaryCab",
      desc: "Was ein Taxi vom Flughafen Gran Canaria (LPA) nach Las Palmas kostet: Preis nach offiziellem BOC-Tarif, Dauer und was Sie bei der Ankunft erwartet.",
      intro: "Die Fahrt zwischen dem Flughafen Gran Canaria (LPA) und der Hauptstadt führt über die Autobahn GC-1 und ist die häufigste der Insel. Abgerechnet wird nach dem offiziellen Überlandtarif (Tarif 3) plus Flughafenzuschlag.",
      practico: [
        "Der Taxistand liegt direkt vor dem Ankunftsterminal, fußläufig, ohne Shuttle.",
        "Der Preis gilt pro Fahrzeug, nicht pro Person: bis zu 4 Fahrgäste zahlen dasselbe.",
        "Von 22:00 bis 6:00 sowie sonn- und feiertags gilt das teurere Nachtfenster.",
        "Bei Flugverspätung können Sie das Taxi mit CanaryCab an der Gepäckausgabe bestellen und die Anfahrt live verfolgen.",
      ],
    },
    "aeropuerto-maspalomas": {
      nombre: "Flughafen → Maspalomas",
      h1: "Taxi vom Flughafen Gran Canaria nach Maspalomas und Playa del Inglés",
      title: "Taxi Flughafen Gran Canaria → Maspalomas · Echter Preis | CanaryCab",
      desc: "Taxipreis vom Flughafen Gran Canaria (LPA) nach Maspalomas und Playa del Inglés nach offiziellem BOC-Tarif, Fahrzeit und praktische Hinweise.",
      intro: "Maspalomas und Playa del Inglés sind das wichtigste Urlaubsziel im Süden Gran Canarias. Vom Flughafen sind es keine halbe Stunde über die GC-1, abgerechnet nach dem offiziellen Überlandtarif plus Flughafenzuschlag.",
      practico: [
        "Das Taxi bringt Sie direkt vor Hotel oder Apartment — ohne Zwischenstopps wie bei Sammeltransfers.",
        "Preis pro Fahrzeug für bis zu 4 Personen: für Familien meist günstiger als Transfers pro Person.",
        "Landet Ihr Flug nachts, gilt das Nachtfenster — rechnen Sie mit ein paar Euro mehr.",
        "Ein rollstuhlgerechtes Taxi können Sie direkt in der App anfordern.",
      ],
    },
    "aeropuerto-puerto-rico": {
      nombre: "Flughafen → Puerto Rico",
      h1: "Taxi vom Flughafen Gran Canaria nach Puerto Rico",
      title: "Taxi Flughafen Gran Canaria → Puerto Rico · Was es kostet | CanaryCab",
      desc: "Was ein Taxi vom Flughafen Gran Canaria (LPA) nach Puerto Rico kostet: Preis nach offiziellem Tarif, Fahrzeit und praktische Tipps.",
      intro: "Puerto Rico de Gran Canaria liegt im Südwesten der Insel, hinter Maspalomas. Die Fahrt vom Flughafen führt weiter über die GC-1 und dauert etwa eine Dreiviertelstunde, nach offiziellem Überlandtarif plus Flughafenzuschlag.",
      practico: [
        "Eine lange Strecke: Den geschätzten Preis vor der Abfahrt bestätigen lassen, wie CanaryCab es bei der Buchung anzeigt.",
        "Die Gegend ist steil mit engen Straßen — geben Sie die Anlage oder das Apartment genau an.",
        "Bis zu 4 Fahrgäste mit Gepäck passen in ein Standardtaxi.",
        "In der Hochsaison und bei Nachtflügen sind weniger Taxis frei: früh bestellen hilft.",
      ],
    },
    "aeropuerto-mogan": {
      nombre: "Flughafen → Puerto de Mogán",
      h1: "Taxi vom Flughafen Gran Canaria nach Puerto de Mogán",
      title: "Taxi Flughafen Gran Canaria → Puerto de Mogán · Preis | CanaryCab",
      desc: "Preis und Dauer für ein Taxi vom Flughafen Gran Canaria (LPA) nach Puerto de Mogán nach offiziellem Überland-BOC-Tarif.",
      intro: "Puerto de Mogán, das «kleine Venedig», liegt im äußersten Südwesten Gran Canarias. Es ist der längste der üblichen Flughafentransfers, abgerechnet nach offiziellem Überlandtarif plus Flughafenzuschlag.",
      practico: [
        "Fast eine Stunde Fahrt: der teuerste der üblichen Transfers, nachts noch deutlich mehr.",
        "Der Preis gilt pro Taxi, nicht pro Person — auf 3 bis 4 Reisende verteilt ist er konkurrenzfähig.",
        "Sperriges Gepäck oder Sportausrüstung vorher angeben, damit ein passendes Fahrzeug kommt.",
        "Mit CanaryCab sehen Sie die echte Route auf der Karte und den Preis vor der Bestätigung.",
      ],
    },
    "las-palmas-maspalomas": {
      nombre: "Las Palmas → Maspalomas",
      h1: "Taxi von Las Palmas nach Maspalomas",
      title: "Taxi Las Palmas → Maspalomas · Preis und Dauer | CanaryCab",
      desc: "Was ein Taxi von Las Palmas de Gran Canaria nach Maspalomas kostet: Preis nach offiziellem Überlandtarif, Dauer und Alternativen.",
      intro: "Von der Hauptstadt in den touristischen Süden sind es gut 50 km über die Autobahn GC-1. Außerhalb der Stadt gilt der offizielle Überlandtarif (Tarif 3); es fällt kein Flughafenzuschlag an, nur der Funktaxi-Zuschlag.",
      practico: [
        "Knapp eine Stunde Fahrt: Ein Taxi lohnt sich vor allem zu mehreren oder mit Gepäck.",
        "Der Tarif wechselt ab 22:00 sowie sonn- und feiertags.",
        "Preis pro Fahrzeug für bis zu 4 Fahrgäste.",
        "CanaryCab berechnet den Betrag auf der echten Route und legt ihn bei der Bestellung fest.",
      ],
    },
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

      <h2>${esc(L.h2Muni)}</h2>
      <p class="nota">${esc(L.muniIntro)}</p>
      <div class="tabla-scroll">
        <table>
          <thead><tr><th>${esc(L.muniCol1)}</th><th>${esc(L.muniCol2)}</th></tr></thead>
          <tbody>
${L.muni.map(([m, t3]) => `            <tr><th scope="row">${esc(m)}</th><td>${esc(t3)}</td></tr>`).join("\n")}
          </tbody>
        </table>
      </div>
      <p class="nota">${esc(L.muniNota)}</p>

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
${EJEMPLOS.map(([id, v]) => {
  const r = RUTAS.find((x) => x.id === id);
  const txt = RUTAS_TEXTO[codigo][id];
  return `            <tr><th scope="row"><a href="/${r.slugs[codigo]}">${esc(txt.nombre)}</a></th><td>${v}</td></tr>`;
}).join("\n")}
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

/** Página de un trayecto concreto (aeropuerto → destino). */
function paginaRuta(codigo, L, ruta) {
  const T = RUTAS_TEXTO[codigo];
  const txt = T[ruta.id];
  const url = `${SITIO}/${ruta.slugs[codigo]}`;
  const dia = precioT3(ruta.km, { aeropuerto: ruta.aeropuerto });
  const noche = precioT3(ruta.km, { noche: true, aeropuerto: ruta.aeropuerto });
  const alternates = Object.keys(IDIOMAS)
    .map((c) => `    <link rel="alternate" hreflang="${c}" href="${SITIO}/${ruta.slugs[c]}" />`)
    .join("\n");

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        serviceType: txt.h1,
        name: txt.h1,
        description: txt.desc,
        url,
        provider: { "@type": "Organization", name: "CanaryCab", url: SITIO },
        areaServed: { "@type": "Place", name: "Gran Canaria" },
        offers: {
          "@type": "Offer",
          priceCurrency: "EUR",
          price: dia.toFixed(2),
          description: T.etiquetas.dia,
          url,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "CanaryCab", item: SITIO },
          { "@type": "ListItem", position: 2, name: L.h1, item: `${SITIO}/${L.slug}` },
          { "@type": "ListItem", position: 3, name: txt.h1, item: url },
        ],
      },
    ],
  };

  const otras = RUTAS.filter((r) => r.id !== ruta.id)
    .map((r) => `<li><a href="/${r.slugs[codigo]}">${esc(T[r.id].nombre)}</a> — ${eur(precioT3(r.km, { aeropuerto: r.aeropuerto }))}</li>`)
    .join("\n          ");

  return `<!doctype html>
<html lang="${L.htmlLang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#0B2E4F" />
    <title>${esc(txt.title)}</title>
    <meta name="description" content="${esc(txt.desc)}" />
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
    <link rel="canonical" href="${url}" />
${alternates}
    <link rel="alternate" hreflang="x-default" href="${SITIO}/${ruta.slugs.es}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${esc(txt.title)}" />
    <meta property="og:description" content="${esc(txt.desc)}" />
    <meta property="og:image" content="${SITIO}/icons/pwa-512.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
    <style>
      :root { --volcanic:#0B2E4F; --taxi:#FFC400; --cream:#F7FBFE; --sand:#EFE7D6; --sand-deep:#DCCFB4; }
      * { box-sizing:border-box; }
      body { margin:0; background:var(--cream); color:var(--volcanic);
        font:16px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; }
      .wrap { max-width:52rem; margin:0 auto; padding:0 1.25rem 4rem; }
      header.hero { background:var(--volcanic); color:var(--cream); padding:2.25rem 0 2rem; }
      header.hero .wrap { padding-bottom:0; }
      .marca { font-weight:900; font-size:1.3rem; color:var(--taxi); text-decoration:none; }
      h1 { font-size:clamp(1.7rem,4.6vw,2.4rem); line-height:1.15; margin:.85rem 0 .6rem; letter-spacing:-.5px; }
      header.hero p { margin:0; color:#F7FBFEc0; }
      h2 { font-size:clamp(1.2rem,3vw,1.5rem); margin:2.25rem 0 .6rem; letter-spacing:-.3px; }
      .cifras { display:grid; grid-template-columns:repeat(auto-fit,minmax(11rem,1fr)); gap:.75rem; margin-top:1.5rem; }
      .cifra { background:#fff; border:1px solid var(--sand-deep); border-radius:16px; padding:1rem 1.15rem; }
      .cifra .et { font-size:.72rem; text-transform:uppercase; letter-spacing:.07em; color:#0B2E4Fa0; font-weight:700; }
      .cifra .v { font-size:1.6rem; font-weight:800; margin-top:.15rem; font-variant-numeric:tabular-nums; }
      .cifra.destacada { background:var(--taxi); border-color:var(--taxi); }
      ul { padding-left:1.15rem; } li { margin:.4rem 0; }
      a { color:#0B5FA5; } header.hero a.marca { color:var(--taxi); }
      .cta { display:inline-block; margin-top:1rem; background:var(--taxi); color:var(--volcanic);
        font-weight:800; padding:.85rem 1.6rem; border-radius:999px; text-decoration:none; }
      .cta-box { margin-top:2.25rem; background:#fff; border:1px solid var(--sand-deep); border-radius:18px; padding:1.4rem; }
      footer { margin-top:2.5rem; padding-top:1.4rem; border-top:1px solid var(--sand-deep); font-size:.85rem; color:#0B2E4F99; }
      footer a { color:inherit; }
      .idiomas { margin-top:.7rem; font-size:.85rem; }
      .idiomas a { color:var(--taxi); text-decoration:none; font-weight:700; margin-right:.9rem; }
      .aviso { font-size:.87rem; color:#0B2E4Fa0; margin-top:.9rem; }
    </style>
  </head>
  <body>
    <header class="hero">
      <div class="wrap">
        <a class="marca" href="/">CanaryCab</a>
        <h1>${esc(txt.h1)}</h1>
        <p>${esc(txt.intro)}</p>
        <p class="idiomas">${Object.keys(IDIOMAS)
          .filter((c) => c !== codigo)
          .map((c) => `<a href="/${ruta.slugs[c]}">${c.toUpperCase()}</a>`)
          .join("")}</p>
      </div>
    </header>

    <main class="wrap">
      <div class="cifras">
        <div class="cifra destacada"><div class="et">${esc(T.etiquetas.dia)}</div><div class="v">${eur(dia)}</div></div>
        <div class="cifra"><div class="et">${esc(T.etiquetas.noche)}</div><div class="v">${eur(noche)}</div></div>
        <div class="cifra"><div class="et">${esc(T.etiquetas.km)}</div><div class="v">${String(ruta.km).replace(".", ",")} km</div></div>
        <div class="cifra"><div class="et">${esc(T.etiquetas.min)}</div><div class="v">${ruta.min} min</div></div>
      </div>
      <p class="aviso">${esc(L.ejNota)}</p>

      <h2>${esc(T.etiquetas.que)}</h2>
      <ul>
        ${txt.practico.map((p) => `<li>${esc(p)}</li>`).join("\n        ")}
      </ul>

      <h2>${esc(T.etiquetas.otras)}</h2>
      <ul>
          ${otras}
      </ul>
      <p><a href="/${L.slug}">${esc(L.h1)} →</a></p>

      <div class="cta-box">
        <h2 style="margin-top:0">${esc(L.cta)}</h2>
        <p class="aviso" style="margin-top:.2rem">${esc(L.ctaNota)}</p>
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

/* ── Páginas legales ────────────────────────────────────────────────────────
 *
 * Van aquí porque, siendo rutas de la SPA, el servidor devolvía para todas el
 * mismo index.html: /privacidad, /terminos, /cookies, /aviso-legal y la portada
 * eran cinco URLs con HTML byte a byte idéntico. Estaban en el sitemap, así que
 * se le pedía a Google indexar cuatro duplicados de la portada; Search Console
 * las dejaba en «Descubierta: actualmente sin indexar», sin llegar a rastrearlas.
 *
 * El contenido sale de src/i18n/legal.js, el mismo módulo que pinta la app, para
 * que no puedan decir cosas distintas. Se generan solo en español: es la versión
 * vinculante y no hay una URL por idioma que justifique hreflang.
 */
// La descripción va escrita a mano y no sacada del primer párrafo: extraerla
// automáticamente daba resultados absurdos (la de privacidad abría hablando del
// Delegado de Protección de Datos). Es lo que se lee bajo el título en Google.
const DOCS_LEGALES = [
  {
    doc: "aviso",
    slug: "aviso-legal",
    desc: "Titular, domicilio y contacto de CanaryCab, condiciones de uso del sitio y legislación aplicable, conforme al artículo 10 de la LSSI-CE.",
  },
  {
    doc: "privacy",
    slug: "privacidad",
    desc: "Qué datos recoge CanaryCab, con qué base jurídica los trata, quién los recibe, cuánto se conservan y cómo ejercer tus derechos de acceso, supresión y portabilidad.",
  },
  {
    doc: "terms",
    slug: "terminos",
    desc: "Condiciones de uso de CanaryCab: qué es y qué no es el servicio, obligaciones de clientes y taxistas, precios estimados, cancelaciones y responsabilidades.",
  },
  {
    doc: "cookies",
    slug: "cookies",
    desc: "Qué cookies y almacenamiento local usa CanaryCab, para qué sirve cada uno, qué servicios de terceros intervienen y cómo eliminarlos desde el navegador.",
  },
];

/** Convierte el marcado ligero de legal.js (**negrita**, `código`) a HTML. */
const rico = (t) =>
  esc(t)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");

function paginaLegal({ doc, slug, desc: descripcion }) {
  const L = LEGAL.es;
  const c = L[doc];
  const url = `${SITIO}/${slug}`;
  const desc = esc(descripcion);

  const cuerpo = c.sections
    .map((s) => {
      const trozos = [`      <h2>${rico(s.t)}</h2>`];
      for (const p of [...(s.p ?? []), ...(s.p2 ?? [])]) trozos.push(`      <p>${rico(p)}</p>`);
      if (s.list?.length)
        trozos.push(`      <ul>\n${s.list.map((i) => `        <li>${rico(i)}</li>`).join("\n")}\n      </ul>`);
      if (s.table)
        trozos.push(
          `      <div class="tabla-scroll">\n        <table>\n` +
            `          <thead><tr>${s.table.headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>\n` +
            `          <tbody>\n${s.table.rows
              .map((r) => `            <tr>${r.map((v) => `<td>${rico(String(v))}</td>`).join("")}</tr>`)
              .join("\n")}\n          </tbody>\n        </table>\n      </div>`
        );
      if (s.note) trozos.push(`      <p class="nota">${rico(s.note)}</p>`);
      return trozos.join("\n");
    })
    .join("\n\n");

  const otros = DOCS_LEGALES.filter((d) => d.slug !== slug)
    .map((d) => `<a href="/${d.slug}">${esc(LEGAL.es[d.doc].title)}</a>`)
    .join(" · ");

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#0B2E4F" />
    <title>${esc(c.title)} · CanaryCab</title>
    <meta name="description" content="${desc}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${esc(c.title)} · CanaryCab" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:site_name" content="CanaryCab" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <style>
      :root { --volcanic:#0B2E4F; --taxi:#FFC400; --cream:#F7FBFE; --sand:#EFE7D6; --sand-deep:#DCCFB4; }
      * { box-sizing: border-box; }
      body { margin:0; background:var(--cream); color:var(--volcanic);
        font: 16px/1.7 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; }
      .wrap { max-width: 48rem; margin: 0 auto; padding: 0 1.25rem 4rem; }
      header.hero { background:var(--volcanic); color:var(--cream); padding:2.5rem 0 2.25rem; }
      header.hero .wrap { padding-bottom:0; }
      .marca { font-weight:900; letter-spacing:-.5px; font-size:1.35rem; color:var(--taxi);
        text-decoration:none; display:inline-block; }
      h1 { font-size: clamp(1.7rem, 5vw, 2.4rem); line-height:1.15; margin:.9rem 0 .4rem; letter-spacing:-.5px; }
      header.hero p { margin:0; color:#F7FBFEa0; font-size:.9rem; }
      h2 { font-size: clamp(1.1rem, 2.8vw, 1.35rem); margin:2.4rem 0 .5rem; letter-spacing:-.3px;
        padding-left:.7rem; border-left:4px solid var(--taxi); }
      p { margin:.7rem 0; }
      ul { margin:.7rem 0; padding-left:1.1rem; }
      li { margin:.35rem 0; }
      code { background:var(--sand); padding:.1rem .35rem; border-radius:4px; font-size:.9em; }
      .nota { background:#fff; border:1px solid var(--sand-deep); border-radius:12px;
        padding:.7rem 1rem; font-size:.92rem; color:#0B2E4Fc0; }
      .aviso { margin:1.75rem 0 0; background:#FFC40018; border:1px solid #FFC40060;
        border-radius:12px; padding:.75rem 1rem; font-size:.88rem; font-weight:600; }
      .tabla-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch;
        border:1px solid var(--sand-deep); border-radius:12px; background:#fff; margin:.9rem 0; }
      table { border-collapse:collapse; width:100%; min-width:28rem; }
      th, td { padding:.6rem .9rem; text-align:left; border-bottom:1px solid var(--sand); font-size:.92rem; }
      thead th { background:var(--sand); font-size:.75rem; text-transform:uppercase; letter-spacing:.06em; }
      tbody tr:last-child td { border-bottom:0; }
      footer { margin-top:3rem; padding-top:1.5rem; border-top:1px solid var(--sand-deep);
        font-size:.85rem; color:#0B2E4F99; }
      footer a { color:inherit; }
    </style>
  </head>
  <body>
    <header class="hero">
      <div class="wrap">
        <a class="marca" href="/">CanaryCab</a>
        <h1>${esc(c.title)}</h1>
        <p>${esc(L.updated)}</p>
      </div>
    </header>

    <main class="wrap">
      <p class="aviso">${esc(DICT.es["legal.binding"])}</p>

${cuerpo}
    </main>

    <div class="wrap">
      <footer>
        <p>${otros}</p>
        <p><a href="/">Volver a CanaryCab</a></p>
      </footer>
    </div>
  </body>
</html>
`;
}

// ── Escribir páginas ────────────────────────────────────────────────────────
mkdirSync(SALIDA, { recursive: true });
for (const d of DOCS_LEGALES) {
  writeFileSync(join(SALIDA, `${d.slug}.html`), paginaLegal(d), "utf8");
  console.log(`  ✔ ${d.slug}.html`);
}
for (const [codigo, L] of Object.entries(IDIOMAS)) {
  writeFileSync(join(SALIDA, `${L.slug}.html`), paginaHtml(codigo, L), "utf8");
  console.log(`  ✔ ${L.slug}.html`);
  for (const ruta of RUTAS) {
    writeFileSync(join(SALIDA, `${ruta.slugs[codigo]}.html`), paginaRuta(codigo, L, ruta), "utf8");
    console.log(`  ✔ ${ruta.slugs[codigo]}.html`);
  }
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
  // páginas de trayecto, con sus alternativas de idioma cruzadas
  ...RUTAS.flatMap((r) => {
    const alt = Object.keys(IDIOMAS)
      .map((c) => `      <xhtml:link rel="alternate" hreflang="${c}" href="${SITIO}/${r.slugs[c]}"/>`)
      .join("\n");
    return Object.keys(IDIOMAS).map(
      (c) =>
        `  <url>\n    <loc>${SITIO}/${r.slugs[c]}</loc>\n    <lastmod>${hoy}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n${alt}\n  </url>`
    );
  }),
  ...["aviso-legal", "privacidad", "cookies", "terminos"].map(
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
