import Link from "next/link";
import { format } from "date-fns";
import {
  REPORT_PERIOD_LABELS,
  type PeriodReport,
  type ReportPeriod,
} from "@/lib/reports";
import { formatPrice, ORDER_STATUS_LABELS, COST_TYPE_LABELS } from "@/lib/constants";
import type { CostType, OrderStatus } from "@prisma/client";

type Props = {
  report: PeriodReport;
  period: ReportPeriod;
  refDate: string;
  basePath: "/admin/reports" | "/super-admin/reports";
};

export function PeriodReportView({
  report,
  period,
  refDate,
  basePath,
}: Props) {
  const pdfHref = `/api/reports/pdf?period=${period}&ref=${refDate}`;

  const cards = [
    { label: "CA livré", value: formatPrice(report.revenue) },
    { label: "Marge brute", value: formatPrice(report.grossMargin) },
    { label: "Charges hors prod.", value: formatPrice(report.costsTotal) },
    {
      label: "Bénéfice net",
      value: formatPrice(report.netProfit),
      negative: report.netProfit < 0,
    },
    { label: "Commandes créées", value: report.ordersCreatedCount },
    { label: "Commandes livrées", value: report.deliveredCount },
    { label: "Unités produites", value: report.producedUnits },
    { label: "Achats matières", value: formatPrice(report.purchasesTotal) },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-brand">
            Rapports
          </h1>
          <p className="mt-1 text-muted capitalize">{report.label}</p>
        </div>
        <a href={pdfHref} className="btn btn-primary !py-2 !px-4 text-sm">
          Télécharger PDF
        </a>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(REPORT_PERIOD_LABELS) as ReportPeriod[]).map((p) => (
          <Link
            key={p}
            href={`${basePath}?period=${p}&ref=${refDate}`}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              period === p
                ? "bg-brand !text-white"
                : "bg-brand/5 text-brand-deep hover:bg-brand/10"
            }`}
          >
            {REPORT_PERIOD_LABELS[p]}
          </Link>
        ))}
      </div>

      <form
        method="get"
        action={basePath}
        className="card-panel flex flex-wrap items-end gap-3"
      >
        <input type="hidden" name="period" value={period} />
        <div>
          <label className="label">Date de référence</label>
          <input
            type="date"
            name="ref"
            defaultValue={refDate}
            className="input"
            required
          />
        </div>
        <button type="submit" className="btn btn-ghost !py-2 !px-4 text-sm">
          Actualiser
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="card-panel">
            <p className="text-sm font-semibold text-muted">{card.label}</p>
            <p
              className={`mt-2 text-2xl font-extrabold ${
                "negative" in card && card.negative
                  ? "text-red-600"
                  : "text-brand-deep"
              }`}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-panel">
          <h2 className="text-lg font-extrabold text-brand-deep">
            Commandes créées — par statut
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {(Object.keys(report.ordersByStatus) as OrderStatus[]).map(
              (status) => (
                <li
                  key={status}
                  className="flex justify-between border-b border-border/60 py-2"
                >
                  <span>{ORDER_STATUS_LABELS[status]}</span>
                  <strong>{report.ordersByStatus[status]}</strong>
                </li>
              )
            )}
          </ul>
        </div>

        <div className="card-panel">
          <h2 className="text-lg font-extrabold text-brand-deep">
            Charges par catégorie
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {(Object.keys(COST_TYPE_LABELS) as CostType[]).map((type) => (
              <li
                key={type}
                className="flex justify-between border-b border-border/60 py-2"
              >
                <span>{COST_TYPE_LABELS[type]}</span>
                <strong>{formatPrice(report.costsByType[type] || 0)}</strong>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card-panel !p-0 overflow-x-auto">
        <div className="px-4 py-3">
          <h2 className="text-lg font-extrabold text-brand-deep">
            Ventes livrées par produit
          </h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-brand/5">
            <tr>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Qté</th>
              <th className="px-4 py-3">CA</th>
              <th className="px-4 py-3">Marge</th>
            </tr>
          </thead>
          <tbody>
            {report.topProducts.map((p) => (
              <tr key={p.name} className="border-t border-border">
                <td className="px-4 py-3 font-semibold">{p.name}</td>
                <td className="px-4 py-3">{p.quantity}</td>
                <td className="px-4 py-3">{formatPrice(p.revenue)}</td>
                <td className="px-4 py-3 font-bold text-brand-deep">
                  {formatPrice(p.margin)}
                </td>
              </tr>
            ))}
            {report.topProducts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted">
                  Aucune vente livrée sur cette période.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card-panel !p-0 overflow-x-auto">
        <div className="px-4 py-3">
          <h2 className="text-lg font-extrabold text-brand-deep">
            Production de la période
          </h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-brand/5">
            <tr>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Qté</th>
              <th className="px-4 py-3">Coût unitaire</th>
              <th className="px-4 py-3">Coût lot</th>
            </tr>
          </thead>
          <tbody>
            {report.productions.map((p, i) => (
              <tr key={`${p.product.name}-${i}`} className="border-t border-border">
                <td className="px-4 py-3 font-semibold">{p.product.name}</td>
                <td className="px-4 py-3">+{p.quantity}</td>
                <td className="px-4 py-3">{formatPrice(p.unitCost)}</td>
                <td className="px-4 py-3">
                  {formatPrice(p.quantity * p.unitCost)}
                </td>
              </tr>
            ))}
            {report.productions.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted">
                  Aucune production sur cette période.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <p className="px-4 py-3 text-xs text-muted">
          Généré le {format(new Date(), "dd/MM/yyyy HH:mm")} — EsthyPyaourt /
          P.Aktion
        </p>
      </div>
    </div>
  );
}
