import { prisma } from "@/lib/prisma";
import {
  ORDER_STATUS_LABELS,
  formatPrice,
} from "@/lib/constants";
import {
  cancelOrder,
  deliverOrder,
  validateOrder,
} from "@/lib/actions/stock";

function statusBadge(status: keyof typeof ORDER_STATUS_LABELS) {
  const map = {
    PENDING: "badge-pending",
    VALIDATED: "badge-validated",
    DELIVERED: "badge-delivered",
    CANCELLED: "badge-cancelled",
  } as const;
  return map[status];
}

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      user: true,
      items: {
        include: { product: { include: { saveur: true, format: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-brand">
          Commandes reçues
        </h1>
        <p className="mt-1 text-muted">
          Validez, livrez et mettez à jour le stock automatiquement
        </p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <article key={order.id} className="card-panel">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-extrabold text-brand-deep">{order.orderNumber}</p>
                <p className="text-sm text-muted">
                  {order.user.name} · {order.user.email}
                </p>
                <p className="text-xs text-muted">
                  {order.createdAt.toLocaleString("fr-FR")}
                  {order.customerPhone ? ` · ${order.customerPhone}` : ""}
                </p>
                {order.customerAddress && (
                  <p className="text-sm text-muted">{order.customerAddress}</p>
                )}
              </div>
              <span className={`badge ${statusBadge(order.status)}`}>
                {ORDER_STATUS_LABELS[order.status]}
              </span>
            </div>

            <ul className="mt-4 space-y-1 text-sm">
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.product.name} ({item.product.saveur.name} ·{" "}
                  {item.product.format.name}) × {item.quantity} —{" "}
                  {formatPrice(item.subtotal)}
                </li>
              ))}
            </ul>
            <p className="mt-2 font-extrabold text-brand">
              Total {formatPrice(order.totalAmount)}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {order.status === "PENDING" && (
                <>
                  <form action={validateOrder.bind(null, order.id)}>
                    <button type="submit" className="btn btn-primary !py-2 !px-4 text-sm">
                      Valider
                    </button>
                  </form>
                  <form action={cancelOrder.bind(null, order.id)}>
                    <button type="submit" className="btn btn-danger !py-2 !px-4 text-sm">
                      Annuler
                    </button>
                  </form>
                </>
              )}
              {order.status === "VALIDATED" && (
                <form action={deliverOrder.bind(null, order.id)}>
                  <button type="submit" className="btn btn-primary !py-2 !px-4 text-sm">
                    Marquer livrée (↓ stock)
                  </button>
                </form>
              )}
            </div>
          </article>
        ))}
      </div>

      {orders.length === 0 && (
        <p className="text-muted">Aucune commande pour le moment.</p>
      )}
    </div>
  );
}
