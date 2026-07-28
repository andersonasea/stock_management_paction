import { prisma } from "@/lib/prisma";
import { formatPrice, MATERIAL_UNIT_LABELS } from "@/lib/constants";
import { addPurchase } from "@/lib/actions/materials";
import { ActionForm } from "@/components/ActionForm";

export default async function AdminPurchasesPage() {
  const [materials, purchases] = await Promise.all([
    prisma.rawMaterial.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.purchase.findMany({
      include: { rawMaterial: true, createdBy: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-brand">
          Achats matières
        </h1>
        <p className="mt-1 text-muted">
          Chaque achat augmente le stock et recalcule le CUMP
        </p>
      </div>

      <div className="card-panel">
        <h2 className="text-lg font-extrabold text-brand-deep">Nouvel achat</h2>
        {materials.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Créez d&apos;abord une matière première.
          </p>
        ) : (
          <ActionForm
            action={addPurchase}
            className="mt-4 grid gap-3 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <label className="label">Matière</label>
              <select name="rawMaterialId" required className="input">
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — stock {m.stockQuantity}{" "}
                    {MATERIAL_UNIT_LABELS[m.unit]} — CUMP{" "}
                    {formatPrice(m.unitCost)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Quantité</label>
              <input
                name="quantity"
                type="number"
                min={0.001}
                step="any"
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">Prix unitaire (CDF)</label>
              <input
                name="unitPrice"
                type="number"
                min={0}
                step="any"
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">Fournisseur</label>
              <input name="supplier" className="input" placeholder="Optionnel" />
            </div>
            <div>
              <label className="label">Note</label>
              <input name="note" className="input" placeholder="Optionnel" />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn btn-primary">
                Enregistrer l&apos;achat
              </button>
            </div>
          </ActionForm>
        )}
      </div>

      <div className="card-panel !p-0 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand/5">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Matière</th>
              <th className="px-4 py-3">Qté</th>
              <th className="px-4 py-3">Prix u.</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Par</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3">
                  {p.createdAt.toLocaleString("fr-FR")}
                </td>
                <td className="px-4 py-3 font-semibold">{p.rawMaterial.name}</td>
                <td className="px-4 py-3">
                  {p.quantity} {p.rawMaterial.unit.toLowerCase()}
                </td>
                <td className="px-4 py-3">{formatPrice(p.unitPrice)}</td>
                <td className="px-4 py-3 font-bold">
                  {formatPrice(p.totalAmount)}
                </td>
                <td className="px-4 py-3">{p.createdBy.name}</td>
              </tr>
            ))}
            {purchases.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted">
                  Aucun achat pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
