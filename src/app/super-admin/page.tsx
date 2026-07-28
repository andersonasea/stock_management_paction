import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/constants";
import { getProfitMetrics } from "@/lib/finance";

export default async function SuperAdminDashboard() {
  const [users, admins, orders, delivered, pending, profit] =
    await Promise.all([
      prisma.user.count({ where: { role: "USER" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.order.count(),
      prisma.order.findMany({
        where: {
          status: "DELIVERED",
          validatedAt: { not: null },
          deliveredAt: { not: null },
        },
        select: { createdAt: true, validatedAt: true, deliveredAt: true },
      }),
      prisma.order.count({ where: { status: "PENDING" } }),
      getProfitMetrics(),
    ]);

  const responseTimes = delivered
    .filter((o) => o.validatedAt)
    .map((o) => {
      const created = o.createdAt.getTime();
      const validated = o.validatedAt!.getTime();
      return (validated - created) / (1000 * 60 * 60);
    });

  const avgResponseHours =
    responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

  const deliveryTimes = delivered
    .filter((o) => o.validatedAt && o.deliveredAt)
    .map((o) => {
      const validated = o.validatedAt!.getTime();
      const deliveredAt = o.deliveredAt!.getTime();
      return (deliveredAt - validated) / (1000 * 60 * 60);
    });

  const avgDeliveryHours =
    deliveryTimes.length > 0
      ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
      : 0;

  const cards = [
    { label: "Clients", value: users },
    { label: "Admins", value: admins },
    { label: "Commandes totales", value: orders },
    { label: "En attente", value: pending },
    {
      label: "CA livré",
      value: formatPrice(profit.revenue),
    },
    {
      label: "Marge brute",
      value: formatPrice(profit.grossMargin),
      hint: "Prix de vente − coût de production (commandes livrées)",
    },
    {
      label: "Coûts cumulés",
      value: formatPrice(profit.costs),
    },
    {
      label: "Bénéfice net",
      value: formatPrice(profit.netProfit),
      hint: "Marge brute − coûts enregistrés",
      highlight: profit.netProfit >= 0,
    },
    {
      label: "Délai moyen de validation",
      value: `${avgResponseHours.toFixed(1)} h`,
    },
    {
      label: "Délai moyen de livraison",
      value: `${avgDeliveryHours.toFixed(1)} h`,
    },
  ];

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-brand">
        Dashboard Super Admin
      </h1>
      <p className="mt-2 text-muted">
        Performance, marge et pilotage EsthyPyaourt / P.Aktion
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="card-panel">
            <p className="text-sm font-semibold text-muted">{card.label}</p>
            <p
              className={`mt-2 text-2xl font-extrabold ${
                "highlight" in card && card.highlight === false
                  ? "text-red-600"
                  : "text-brand-deep"
              }`}
            >
              {card.value}
            </p>
            {"hint" in card && card.hint ? (
              <p className="mt-2 text-xs text-muted">{card.hint}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
