import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  format,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  subDays,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { TrendsChart } from "@/components/TrendsChart";

async function getOrders() {
  return prisma.order.findMany({
    where: { status: { not: "CANCELLED" } },
    select: { createdAt: true, totalAmount: true },
    orderBy: { createdAt: "asc" },
  });
}

function bucket(
  orders: { createdAt: Date; totalAmount: number }[],
  keys: Date[],
  labelFn: (d: Date) => string,
  startFn: (d: Date) => Date
) {
  return keys.map((key) => {
    const start = startFn(key).getTime();
    const nextIndex = keys.indexOf(key) + 1;
    const end =
      nextIndex < keys.length
        ? startFn(keys[nextIndex]).getTime()
        : Date.now() + 1;
    const items = orders.filter((o) => {
      const t = o.createdAt.getTime();
      return t >= start && t < end;
    });
    return {
      label: labelFn(key),
      count: items.length,
      amount: items.reduce((s, i) => s + i.totalAmount, 0),
    };
  });
}

export default async function TrendsPage() {
  const orders = await getOrders();
  const now = new Date();

  const dayKeys = eachDayOfInterval({
    start: subDays(now, 6),
    end: now,
  });
  const byDay = bucket(
    orders,
    dayKeys,
    (d) => format(d, "EEE d", { locale: fr }),
    startOfDay
  );

  const weekKeys = eachWeekOfInterval(
    { start: subDays(now, 28), end: now },
    { weekStartsOn: 1 }
  );
  const byWeek = bucket(
    orders,
    weekKeys,
    (d) => format(d, "'S'w", { locale: fr }),
    (d) => startOfWeek(d, { weekStartsOn: 1 })
  );

  const monthKeys = eachMonthOfInterval({
    start: subMonths(now, 5),
    end: now,
  });
  const byMonth = bucket(
    orders,
    monthKeys,
    (d) => format(d, "MMM", { locale: fr }),
    startOfMonth
  );

  const yearStart = startOfYear(subMonths(now, 36));
  const yearKeys = [
    yearStart,
    startOfYear(subMonths(now, 24)),
    startOfYear(subMonths(now, 12)),
    startOfYear(now),
  ].filter(
    (d, i, arr) => arr.findIndex((x) => x.getTime() === d.getTime()) === i
  );
  const byYear = bucket(
    orders,
    yearKeys,
    (d) => format(d, "yyyy"),
    startOfYear
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-brand">
          Tendances de commandes
        </h1>
        <p className="mt-1 text-muted">Vue jour · semaine · mois · année</p>
      </div>
      <TrendsChart data={byDay} title="7 derniers jours" />
      <TrendsChart data={byWeek} title="4 dernières semaines" />
      <TrendsChart data={byMonth} title="6 derniers mois" />
      <TrendsChart data={byYear} title="Par année" />
    </div>
  );
}
