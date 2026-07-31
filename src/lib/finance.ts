import { prisma } from "@/lib/prisma";

/** KPIs financiers basés sur les commandes livrées + coût de revient snapshot. */
export async function getProfitMetrics() {
  // Séquentiel : DATABASE_URL a souvent connection_limit=1 (Supabase pooler)
  const deliveredItems = await prisma.orderItem.findMany({
    where: { order: { status: "DELIVERED" } },
    select: {
      quantity: true,
      unitPrice: true,
      productionCost: true,
      product: { select: { productionCost: true } },
    },
  });
  const costsAgg = await prisma.cost.aggregate({ _sum: { amount: true } });
  const revenueAgg = await prisma.order.aggregate({
    where: { status: "DELIVERED" },
    _sum: { totalAmount: true },
  });

  const revenue = revenueAgg._sum.totalAmount || 0;
  const costs = costsAgg._sum.amount || 0;

  const grossMargin = deliveredItems.reduce((sum, item) => {
    const cost =
      item.productionCost > 0
        ? item.productionCost
        : item.product.productionCost;
    return sum + (item.unitPrice - cost) * item.quantity;
  }, 0);

  const netProfit = grossMargin - costs;

  return { revenue, costs, grossMargin, netProfit };
}
