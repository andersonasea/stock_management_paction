import { prisma } from "@/lib/prisma";

/** KPIs financiers basés sur les commandes livrées + coût de revient snapshot. */
export async function getProfitMetrics() {
  const [deliveredItems, costsAgg, revenueAgg] = await Promise.all([
    prisma.orderItem.findMany({
      where: { order: { status: "DELIVERED" } },
      select: {
        quantity: true,
        unitPrice: true,
        productionCost: true,
        product: { select: { productionCost: true } },
      },
    }),
    prisma.cost.aggregate({ _sum: { amount: true } }),
    prisma.order.aggregate({
      where: { status: "DELIVERED" },
      _sum: { totalAmount: true },
    }),
  ]);

  const revenue = revenueAgg._sum.totalAmount || 0;
  const costs = costsAgg._sum.amount || 0;

  /** Marge brute = Σ (prix vente − coût prod snapshot) × qté livrée */
  const grossMargin = deliveredItems.reduce((sum, item) => {
    const cost =
      item.productionCost > 0
        ? item.productionCost
        : item.product.productionCost;
    return sum + (item.unitPrice - cost) * item.quantity;
  }, 0);

  /** Bénéfice net = marge brute − charges hors production */
  const netProfit = grossMargin - costs;

  return { revenue, costs, grossMargin, netProfit };
}
