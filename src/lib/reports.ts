import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  parseISO,
  isValid,
} from "date-fns";
import { fr } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { COST_TYPE_LABELS } from "@/lib/constants";

export type ReportPeriod = "day" | "week" | "month";

export const REPORT_PERIOD_LABELS: Record<ReportPeriod, string> = {
  day: "Journalier",
  week: "Hebdomadaire",
  month: "Mensuel",
};

export function parseReportPeriod(value: string | undefined): ReportPeriod {
  if (value === "week" || value === "month" || value === "day") return value;
  return "day";
}

export function parseReportRef(value: string | undefined): Date {
  if (value) {
    const d = parseISO(value);
    if (isValid(d)) return d;
  }
  return new Date();
}

export function getPeriodRange(period: ReportPeriod, ref: Date) {
  if (period === "week") {
    const start = startOfWeek(ref, { weekStartsOn: 1 });
    const end = endOfWeek(ref, { weekStartsOn: 1 });
    return { start, end };
  }
  if (period === "month") {
    return { start: startOfMonth(ref), end: endOfMonth(ref) };
  }
  return { start: startOfDay(ref), end: endOfDay(ref) };
}

export function formatPeriodLabel(period: ReportPeriod, start: Date, end: Date) {
  if (period === "day") {
    return format(start, "EEEE d MMMM yyyy", { locale: fr });
  }
  if (period === "week") {
    return `Semaine du ${format(start, "d MMM", { locale: fr })} au ${format(end, "d MMM yyyy", { locale: fr })}`;
  }
  return format(start, "MMMM yyyy", { locale: fr });
}

export async function getPeriodReport(period: ReportPeriod, ref: Date) {
  const { start, end } = getPeriodRange(period, ref);
  const inRange = { gte: start, lte: end };

  // Requêtes séquentielles : le pool Supabase est souvent limité à 1 connexion
  const ordersCreated = await prisma.order.findMany({
    where: { createdAt: inRange },
    select: { status: true, totalAmount: true },
  });
  const deliveredOrders = await prisma.order.findMany({
    where: { status: "DELIVERED", deliveredAt: inRange },
    select: {
      id: true,
      totalAmount: true,
      orderNumber: true,
      deliveredAt: true,
    },
    orderBy: { deliveredAt: "desc" },
  });
  const deliveredItems = await prisma.orderItem.findMany({
    where: {
      order: { status: "DELIVERED", deliveredAt: inRange },
    },
    select: {
      quantity: true,
      unitPrice: true,
      productionCost: true,
      product: { select: { name: true, productionCost: true } },
    },
  });
  const purchases = await prisma.purchase.findMany({
    where: { createdAt: inRange },
    select: {
      quantity: true,
      totalAmount: true,
      rawMaterial: { select: { name: true, unit: true } },
    },
  });
  const productions = await prisma.production.findMany({
    where: { createdAt: inRange },
    select: {
      quantity: true,
      unitCost: true,
      product: { select: { name: true } },
    },
  });
  const costs = await prisma.cost.findMany({
    where: { createdAt: inRange },
    select: { type: true, label: true, amount: true },
    orderBy: { createdAt: "desc" },
  });

  const ordersByStatus = {
    PENDING: 0,
    VALIDATED: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  };
  for (const o of ordersCreated) {
    ordersByStatus[o.status] += 1;
  }

  const revenue = deliveredOrders.reduce((s, o) => s + o.totalAmount, 0);

  const productSales: Record<
    string,
    { name: string; quantity: number; revenue: number; margin: number }
  > = {};

  let grossMargin = 0;
  for (const item of deliveredItems) {
    const cost =
      item.productionCost > 0
        ? item.productionCost
        : item.product.productionCost;
    const lineMargin = (item.unitPrice - cost) * item.quantity;
    const lineRevenue = item.unitPrice * item.quantity;
    grossMargin += lineMargin;

    const key = item.product.name;
    if (!productSales[key]) {
      productSales[key] = {
        name: key,
        quantity: 0,
        revenue: 0,
        margin: 0,
      };
    }
    productSales[key].quantity += item.quantity;
    productSales[key].revenue += lineRevenue;
    productSales[key].margin += lineMargin;
  }

  const costsTotal = costs.reduce((s, c) => s + c.amount, 0);
  const costsByType: Record<string, number> = {
    DISTRIBUTION: 0,
    COMMERCIAL: 0,
    ADMINISTRATIVE: 0,
    OTHER: 0,
  };
  for (const c of costs) {
    costsByType[c.type] = (costsByType[c.type] || 0) + c.amount;
  }

  const purchasesTotal = purchases.reduce((s, p) => s + p.totalAmount, 0);
  const producedUnits = productions.reduce((s, p) => s + p.quantity, 0);
  const productionCostTotal = productions.reduce(
    (s, p) => s + p.quantity * p.unitCost,
    0
  );

  return {
    period,
    start,
    end,
    label: formatPeriodLabel(period, start, end),
    ordersCreatedCount: ordersCreated.length,
    ordersByStatus,
    deliveredCount: deliveredOrders.length,
    revenue,
    grossMargin,
    costsTotal,
    costsByType,
    costs,
    netProfit: grossMargin - costsTotal,
    purchasesTotal,
    purchasesCount: purchases.length,
    purchases,
    producedUnits,
    productionLots: productions.length,
    productionCostTotal,
    productions,
    topProducts: Object.values(productSales).sort(
      (a, b) => b.revenue - a.revenue
    ),
    costTypeLabels: COST_TYPE_LABELS,
  };
}

export type PeriodReport = Awaited<ReturnType<typeof getPeriodReport>>;
