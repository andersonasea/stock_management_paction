import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { PeriodReport } from "@/lib/reports";
import { REPORT_PERIOD_LABELS } from "@/lib/reports";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

function money(n: number) {
  return new Intl.NumberFormat("fr-CD", {
    style: "currency",
    currency: "CDF",
    maximumFractionDigits: 0,
  }).format(n);
}

/** pdf-lib StandardFonts = WinAnsi : on retire les caractères non supportés. */
function ascii(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "?");
}

export async function buildReportPdf(report: PeriodReport): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const maxWidth = pageWidth - margin * 2;
  const brand = rgb(0.1, 0.23, 0.56);
  const dark = rgb(0.13, 0.13, 0.13);
  const muted = rgb(0.4, 0.4, 0.4);

  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const ensureSpace = (needed: number) => {
    if (y - needed < margin) {
      page = pdf.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };

  const draw = (
    text: string,
    size: number,
    color: ReturnType<typeof rgb>,
    bold = false,
    gap = 14
  ) => {
    ensureSpace(gap + 4);
    page.drawText(ascii(text), {
      x: margin,
      y,
      size,
      font: bold ? fontBold : font,
      color,
      maxWidth,
    });
    y -= gap;
  };

  draw("EsthyPyaourt", 18, brand, true, 22);
  draw("Rapport d'activite - P.Aktion / Kinshasa", 9, muted, false, 16);
  draw(
    `Rapport ${REPORT_PERIOD_LABELS[report.period].toLowerCase()}`,
    14,
    brand,
    true,
    18
  );
  draw(report.label, 11, dark, false, 14);
  draw(
    `Genere le ${format(new Date(), "d MMMM yyyy 'a' HH:mm", { locale: fr })}`,
    8,
    muted,
    false,
    20
  );

  draw("Indicateurs", 12, brand, true, 18);
  const kpi: [string, string][] = [
    ["CA livre", money(report.revenue)],
    ["Marge brute", money(report.grossMargin)],
    ["Charges hors prod.", money(report.costsTotal)],
    ["Benefice net", money(report.netProfit)],
    ["Commandes creees", String(report.ordersCreatedCount)],
    ["Commandes livrees", String(report.deliveredCount)],
    ["Unites produites", String(report.producedUnits)],
    ["Achats MP", money(report.purchasesTotal)],
  ];
  for (const [label, value] of kpi) {
    draw(`${label} : ${value}`, 10, dark, false, 13);
  }

  y -= 6;
  draw("Commandes creees par statut", 12, brand, true, 18);
  for (const [status, count] of Object.entries(report.ordersByStatus)) {
    const statusLabel =
      ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] || status;
    draw(`${statusLabel} : ${count}`, 10, dark, false, 13);
  }

  if (report.topProducts.length > 0) {
    y -= 6;
    draw("Ventes livrees par produit", 12, brand, true, 18);
    for (const p of report.topProducts) {
      draw(
        `${p.name} - qte ${p.quantity} - CA ${money(p.revenue)} - marge ${money(p.margin)}`,
        9,
        dark,
        false,
        12
      );
    }
  }

  if (report.costs.length > 0) {
    y -= 6;
    draw("Charges de la periode", 12, brand, true, 18);
    for (const c of report.costs) {
      const typeLabel =
        report.costTypeLabels[c.type as keyof typeof report.costTypeLabels] ||
        c.type;
      draw(`${typeLabel} - ${c.label} : ${money(c.amount)}`, 9, dark, false, 12);
    }
  }

  if (report.productions.length > 0) {
    y -= 6;
    draw("Production", 12, brand, true, 18);
    for (const p of report.productions) {
      draw(
        `${p.product.name} - +${p.quantity} - cout u. ${money(p.unitCost)}`,
        9,
        dark,
        false,
        12
      );
    }
  }

  y -= 10;
  draw(
    "Marge brute = (prix vente - cout de revient) x qte livree. Benefice net = marge - charges hors production.",
    8,
    muted,
    false,
    12
  );

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}
