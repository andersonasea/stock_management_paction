import { prisma } from "@/lib/prisma";
import { COST_TYPE_LABELS, formatPrice } from "@/lib/constants";
import { addCost } from "@/lib/actions/stock";
import { ActionForm } from "@/components/ActionForm";

export default async function AdminCostsPage() {
  const costs = await prisma.cost.findMany({
    include: { createdBy: true },
    orderBy: { createdAt: "desc" },
  });

  const totals = {
    FIXED: 0,
    VARIABLE: 0,
    OTHER: 0,
  };
  for (const c of costs) totals[c.type] += c.amount;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-brand">
          Coûts
        </h1>
        <p className="mt-1 text-muted">
          Charges fixes, variables et autres dépenses
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {(Object.keys(totals) as Array<keyof typeof totals>).map((type) => (
          <div key={type} className="card-panel">
            <p className="text-sm font-semibold text-muted">
              {COST_TYPE_LABELS[type]}
            </p>
            <p className="mt-2 text-2xl font-extrabold text-brand-deep">
              {formatPrice(totals[type])}
            </p>
          </div>
        ))}
      </div>

      <div className="card-panel">
        <h2 className="text-lg font-extrabold text-brand-deep">Ajouter un coût</h2>
        <ActionForm action={addCost} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Type</label>
            <select name="type" className="input" required>
              <option value="FIXED">Charge fixe</option>
              <option value="VARIABLE">Charge variable</option>
              <option value="OTHER">Autre</option>
            </select>
          </div>
          <div>
            <label className="label">Montant (CDF)</label>
            <input name="amount" type="number" min={1} required className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Libellé</label>
            <input name="label" required className="input" placeholder="Loyer, emballage…" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea name="description" className="input min-h-20" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn btn-primary">
              Enregistrer
            </button>
          </div>
        </ActionForm>
      </div>

      <div className="card-panel !p-0 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand/5">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Libellé</th>
              <th className="px-4 py-3">Montant</th>
              <th className="px-4 py-3">Par</th>
            </tr>
          </thead>
          <tbody>
            {costs.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-3">
                  {c.createdAt.toLocaleDateString("fr-FR")}
                </td>
                <td className="px-4 py-3">{COST_TYPE_LABELS[c.type]}</td>
                <td className="px-4 py-3">{c.label}</td>
                <td className="px-4 py-3 font-bold">{formatPrice(c.amount)}</td>
                <td className="px-4 py-3">{c.createdBy.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
