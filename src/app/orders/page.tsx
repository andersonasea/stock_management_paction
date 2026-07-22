import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  ORDER_STATUS_LABELS,
  formatPrice,
} from "@/lib/constants";
import { redirect } from "next/navigation";

function statusBadge(status: keyof typeof ORDER_STATUS_LABELS) {
  const map = {
    PENDING: "badge-pending",
    VALIDATED: "badge-validated",
    DELIVERED: "badge-delivered",
    CANCELLED: "badge-cancelled",
  } as const;
  return map[status];
}

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: { include: { product: { include: { saveur: true, format: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-brand">
        Mes commandes
      </h1>
      <p className="mt-2 text-muted">Suivi de vos commandes EsthyPyaourt</p>

      <div className="mt-8 space-y-4">
        {orders.map((order) => (
          <article key={order.id} className="card-panel">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-extrabold text-brand-deep">{order.orderNumber}</p>
                <p className="text-sm text-muted">
                  {order.createdAt.toLocaleString("fr-FR")}
                </p>
              </div>
              <span className={`badge ${statusBadge(order.status)}`}>
                {ORDER_STATUS_LABELS[order.status]}
              </span>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span>
                    {item.product.name} ({item.product.saveur.name} ·{" "}
                    {item.product.format.name}) × {item.quantity}
                  </span>
                  <span className="font-semibold">
                    {formatPrice(item.subtotal)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-right text-lg font-extrabold text-brand">
              Total {formatPrice(order.totalAmount)}
            </p>
          </article>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="card-panel mt-8 text-center">
          <p className="text-muted">Aucune commande pour l&apos;instant.</p>
          <Link href="/catalogue" className="btn btn-primary mt-4 inline-flex">
            Voir le catalogue
          </Link>
        </div>
      )}
    </div>
  );
}
