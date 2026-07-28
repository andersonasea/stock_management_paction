import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/constants";
import { getProfitMetrics } from "@/lib/finance";

export default async function AdminHomePage() {
  const [products, pendingOrders, stockSum, profit] = await Promise.all([
    prisma.product.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.product.aggregate({ _sum: { stockQuantity: true } }),
    getProfitMetrics(),
  ]);

  const cards = [
    { label: "Produits", value: products, href: "/admin/products" },
    {
      label: "Commandes en attente",
      value: pendingOrders,
      href: "/admin/orders",
    },
    {
      label: "Unités en stock",
      value: stockSum._sum.stockQuantity || 0,
      href: "/admin/stock",
    },
    {
      label: "CA livré",
      value: formatPrice(profit.revenue),
      href: "/admin/orders",
    },
    {
      label: "Marge brute",
      value: formatPrice(profit.grossMargin),
      href: "/admin/products",
      hint: "Vente − coût de production",
    },
    {
      label: "Charges hors prod.",
      value: formatPrice(profit.costs),
      href: "/admin/costs",
    },
    {
      label: "Bénéfice net",
      value: formatPrice(profit.netProfit),
      href: "/admin/costs",
      hint: "Marge brute − charges",
      negative: profit.netProfit < 0,
    },
  ];

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-brand">
        Tableau de bord admin
      </h1>
      <p className="mt-2 text-muted">
        Gestion stock, coûts, marge et validation des commandes
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="card-panel hover:border-brand-sky"
          >
            <p className="text-sm font-semibold text-muted">{card.label}</p>
            <p
              className={`mt-2 text-3xl font-extrabold ${
                "negative" in card && card.negative
                  ? "text-red-600"
                  : "text-brand-deep"
              }`}
            >
              {card.value}
            </p>
            {"hint" in card && card.hint ? (
              <p className="mt-2 text-xs text-muted">{card.hint}</p>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
