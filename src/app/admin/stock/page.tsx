import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/constants";
import { addProduction } from "@/lib/actions/stock";
import { ActionForm } from "@/components/ActionForm";

export default async function AdminStockPage() {
  const [products, productions] = await Promise.all([
    prisma.product.findMany({
      include: {
        saveur: true,
        format: true,
        recipeItems: { include: { rawMaterial: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.production.findMany({
      include: {
        product: true,
        createdBy: true,
        consumptions: { include: { rawMaterial: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-brand">
          Stock & production
        </h1>
        <p className="mt-1 text-muted">
          La production consomme les matières selon la recette et calcule le
          coût de revient
        </p>
      </div>

      <div className="card-panel">
        <h2 className="text-lg font-extrabold text-brand-deep">
          Nouvelle production
        </h2>
        <ActionForm
          action={addProduction}
          className="mt-4 grid gap-3 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <label className="label">Produit</label>
            <select name="productId" required className="input">
              {products.map((p) => {
                const theoretical = p.recipeItems.reduce(
                  (s, i) => s + i.quantityPerUnit * i.rawMaterial.unitCost,
                  0
                );
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} — stock {p.stockQuantity}
                    {p.recipeItems.length === 0
                      ? " (pas de recette !)"
                      : ` — coût th. ${Math.round(theoretical)} CDF`}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="label">Quantité produite</label>
            <input
              name="quantity"
              type="number"
              min={1}
              required
              className="input"
            />
          </div>
          <div>
            <label className="label">Note</label>
            <input
              name="note"
              className="input"
              placeholder="Lot du matin…"
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn btn-primary">
              Produire (consommer les matières)
            </button>
          </div>
        </ActionForm>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {products.map((p) => (
          <div key={p.id} className="card-panel">
            <p className="font-extrabold text-brand-deep">{p.name}</p>
            <p className="text-sm text-muted">
              {p.saveur.name} · {p.format.name}
            </p>
            <p className="mt-3 text-3xl font-extrabold text-brand">
              {p.stockQuantity}
            </p>
            <p className="text-xs text-muted">unités restantes</p>
            <p className="mt-2 text-sm">
              Coût de revient :{" "}
              <strong>{formatPrice(p.productionCost)}</strong>
            </p>
            {p.recipeItems.length === 0 ? (
              <p className="mt-2 text-xs text-danger">
                Pas de recette —{" "}
                <Link
                  href={`/admin/products/${p.id}`}
                  className="font-semibold underline"
                >
                  définir
                </Link>
              </p>
            ) : (
              <p className="mt-2 text-xs text-muted">
                {p.recipeItems.length} matière(s) en nomenclature
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="card-panel !p-0 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand/5">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Qté</th>
              <th className="px-4 py-3">Coût u.</th>
              <th className="px-4 py-3">Consommations</th>
              <th className="px-4 py-3">Par</th>
            </tr>
          </thead>
          <tbody>
            {productions.map((prod) => (
              <tr key={prod.id} className="border-t border-border">
                <td className="px-4 py-3">
                  {prod.createdAt.toLocaleString("fr-FR")}
                </td>
                <td className="px-4 py-3">{prod.product.name}</td>
                <td className="px-4 py-3 font-bold">+{prod.quantity}</td>
                <td className="px-4 py-3">{formatPrice(prod.unitCost)}</td>
                <td className="px-4 py-3 text-xs text-muted">
                  {prod.consumptions.length === 0
                    ? "—"
                    : prod.consumptions
                        .map(
                          (c) =>
                            `${c.rawMaterial.name}: ${c.quantity}${c.rawMaterial.unit.toLowerCase()}`
                        )
                        .join(" · ")}
                </td>
                <td className="px-4 py-3">{prod.createdBy.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
