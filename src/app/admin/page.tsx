import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/constants";

export default async function AdminHomePage() {
  const [products, pendingOrders, stockSum, costs] = await Promise.all([
    prisma.product.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.product.aggregate({ _sum: { stockQuantity: true } }),
    prisma.cost.aggregate({ _sum: { amount: true } }),
  ]);

  const cards = [
    { label: "Produits", value: products, href: "/admin/products" },
    { label: "Commandes en attente", value: pendingOrders, href: "/admin/orders" },
    {
      label: "Unités en stock",
      value: stockSum._sum.stockQuantity || 0,
      href: "/admin/stock",
    },
    {
      label: "Total coûts",
      value: formatPrice(costs._sum.amount || 0),
      href: "/admin/costs",
    },
  ];

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-brand">
        Tableau de bord admin
      </h1>
      <p className="mt-2 text-muted">
        Gestion stock, coûts et validation des commandes
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="card-panel hover:border-brand-sky">
            <p className="text-sm font-semibold text-muted">{card.label}</p>
            <p className="mt-2 text-3xl font-extrabold text-brand-deep">
              {card.value}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
