import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COST_TYPE_LABELS, formatPrice } from "@/lib/constants";
import { updateCost, deleteCost } from "@/lib/actions/stock";
import { ActionForm } from "@/components/ActionForm";
import type { CostType } from "@prisma/client";

type Props = { params: Promise<{ id: string }> };

export default async function EditCostPage({ params }: Props) {
  const { id } = await params;
  const cost = await prisma.cost.findUnique({
    where: { id },
    include: { createdBy: true },
  });
  if (!cost) notFound();

  const updateAction = updateCost.bind(null, cost.id);
  const types = Object.keys(COST_TYPE_LABELS) as CostType[];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-brand">
            Modifier la charge
          </h1>
          <p className="mt-1 text-muted">
            {cost.label} — {cost.createdAt.toLocaleDateString("fr-FR")} — par{" "}
            {cost.createdBy.name}
          </p>
        </div>
        <Link href="/admin/costs" className="btn btn-ghost !py-2 !px-4 text-sm">
          ← Retour
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card-panel">
          <p className="text-sm font-semibold text-muted">Type actuel</p>
          <p className="mt-2 text-xl font-extrabold text-brand-deep">
            {COST_TYPE_LABELS[cost.type]}
          </p>
        </div>
        <div className="card-panel">
          <p className="text-sm font-semibold text-muted">Montant actuel</p>
          <p className="mt-2 text-xl font-extrabold text-brand-deep">
            {formatPrice(cost.amount)}
          </p>
        </div>
      </div>

      <div className="card-panel">
        <ActionForm action={updateAction} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Type</label>
            <select
              name="type"
              className="input"
              required
              defaultValue={cost.type}
            >
              {types.map((type) => (
                <option key={type} value={type}>
                  {COST_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Montant (CDF)</label>
            <input
              name="amount"
              type="number"
              min={1}
              required
              className="input"
              defaultValue={cost.amount}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Libellé</label>
            <input
              name="label"
              required
              className="input"
              defaultValue={cost.label}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea
              name="description"
              className="input min-h-20"
              defaultValue={cost.description || ""}
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn btn-primary">
              Enregistrer les modifications
            </button>
          </div>
        </ActionForm>
      </div>

      <div className="card-panel border-danger/30">
        <h2 className="text-lg font-extrabold text-danger">Zone dangereuse</h2>
        <p className="mt-1 text-sm text-muted">
          La suppression retire définitivement cette charge des totaux et des
          rapports.
        </p>
        <form action={deleteCost.bind(null, cost.id)} className="mt-4">
          <button type="submit" className="btn btn-danger">
            Supprimer cette charge
          </button>
        </form>
      </div>
    </div>
  );
}
