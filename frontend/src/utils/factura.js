import jsPDF from "jspdf";

const eur = (v) => (v == null ? "—" : `${Number(v).toFixed(2)} €`);

/**
 * Genera y descarga un recibo PDF del viaje. Recibe `t` (traductor i18n) para
 * que el recibo salga en el idioma activo del usuario.
 */
export function descargarFactura(v, t) {
  const tr = t || ((k) => k); // fallback defensivo
  const locale = tr("pdf.locale") || "es-ES";
  const fecha = (s) =>
    s ? new Date(s).toLocaleString(locale, { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
  const mapPoint = tr("pdf.mapPoint");

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 48;
  let y = 56;

  // Cabecera marca
  doc.setFillColor(11, 46, 79);
  doc.rect(0, 0, W, 96, "F");
  doc.setTextColor(255, 196, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("CanaryCab", M, 56);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(tr("pdf.receipt"), M, 76);

  y = 140;
  doc.setTextColor(11, 46, 79);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`${tr("pdf.receiptNo")} #${v.id}`, M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(fecha(v.completadoEn || v.solicitadoEn), W - M, y, { align: "right" });

  y += 26;
  doc.setDrawColor(220, 220, 220);
  doc.line(M, y, W - M, y);
  y += 24;

  const fila = (etq, val) => {
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(etq, M, y);
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.text(String(val || "—"), W - M, y, { align: "right" });
    y += 22;
  };

  fila(tr("pdf.origin"), v.origenTexto || mapPoint);
  fila(tr("pdf.dest"), v.detalle || v.destinoTexto || mapPoint);
  fila(tr("pdf.distance"), `${Number(v.distanciaRealKm ?? v.distanciaEstimadaKm ?? 0).toFixed(1)} km`);
  if (v.taxistaNombre) fila(tr("pdf.driver"), v.taxistaNombre);
  if (v.taxistaMatricula) fila(tr("pdf.plate"), v.taxistaMatricula);
  if (v.taxistaLicencia) fila(tr("pdf.license"), v.taxistaLicencia);
  fila(tr("pdf.status"), v.estado ? tr(`badge.${v.estado}`) : "—");

  y += 10;
  doc.setDrawColor(220, 220, 220);
  doc.line(M, y, W - M, y);
  y += 30;

  // Total
  doc.setFillColor(255, 196, 0);
  doc.roundedRect(M, y - 22, W - 2 * M, 40, 8, 8, "F");
  doc.setTextColor(11, 46, 79);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(tr("pdf.total"), M + 16, y + 3);
  doc.setFontSize(16);
  doc.text(eur(v.precioFinal ?? v.precioEstimado), W - M - 16, y + 4, { align: "right" });

  y += 64;
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(tr("pdf.footer1"), M, y);
  doc.text(tr("pdf.footer2"), M, y + 12);

  doc.save(`${tr("pdf.fileName")}-${v.id}.pdf`);
}
