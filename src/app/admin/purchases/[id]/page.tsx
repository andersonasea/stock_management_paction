import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice, MATERIAL_UNIT_LABELS } from "@/lib/constants";
import { updatePurchase, deletePurchase } from "@/lib/actions/materials";
import { ActionForm } from "@/components/ActionForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditPurchasePage({ params }: Props) {
  const { id } = await params;
  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: { rawMaterial: true, createdBy: true },
  });
  if (!purchase) notFound();

  const materials = await prisma.rawMaterial.findMany({
    where: {
      OR: [{ isActive: true }, { id: purchase.rawMaterialId }],
    },
    orderBy: { name: "asc" },
  });

  const updateAction = updatePurchase.bind(null, purchase.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-brand">
            Modifier l&apos;achat
          </h1>
          <p className="mt-1 text-muted">
            {purchase.rawMaterial.name} —{" "}
            {purchase.createdAt.toLocaleString("fr-FR")} — par{" "}
            {purchase.createdBy.name}
          </p>
        </div>
        <Link
          href="/admin/purchases"
          className="btn btn-ghost !py-2 !px-4 text-sm"
        >
          ← Retour
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card-panel">
          <p className="text-sm font-semibold text-muted">Quantité actuelle</p>
          <p className="mt-2 text-2xl font-extrabold text-brand-deep">
            {purchase.quantity} {purchase.rawMaterial.unit.toLowerCase()}
          </p>
        </div>
        <div className="card-panel">
          <p className="text-sm font-semibold text-muted">Prix unitaire</p>
          <p className="mt-2 text-2xl font-extrabold text-brand-deep">
            {formatPrice(purchase.unitPrice)}
          </p>
        </div>
        <div className="card-panel">
          <p className="text-sm font-semibold text-muted">Total</p>
          <p className="mt-2 text-2xl font-extrabold text-brand-deep">
            {formatPrice(purchase.totalAmount)}
          </p>
        </div>
      </div>

      <div className="card-panel">
        <ActionForm action={updateAction} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Matière</label>
            <select
              name="rawMaterialId"
              required
              className="input"
              defaultValue={purchase.rawMaterialId}
            >
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({MATERIAL_UNIT_LABELS[m.unit]}) — stock{" "}
                  {m.stockQuantity}
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
              defaultValue={purchase.quantity}
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
              defaultValue={purchase.unitPrice}
            />
          </div>
          <div>
            <label className="label">Fournisseur</label>
            <input
              name="supplier"
              className="input"
              defaultValue={purchase.supplier || ""}
            />
          </div>
          <div>
            <label className="label">Note</label>
            <input
              name="note"
              className="input"
              defaultValue={purchase.note || ""}
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn btn-primary">
              Enregistrer les modifications
            </button>
          </div>
        </ActionForm>
        <p className="mt-3 text-xs text-muted">
          Le stock et le CUMP de la matière sont recalculés automatiquement
          après modification.
        </p>
      </div>

      <div className="card-panel border-danger/30">
        <h2 className="text-lg font-extrabold text-danger">Zone dangereuse</h2>
        <p className="mt-1 text-sm text-muted">
          La suppression est refusée si elle rendrait le stock matière négatif
          (consommations de production déjà enregistrées).
        </p>
        <form
          action={deletePurchase.bind(null, purchase.id)}
          className="mt-4"
        >
          <button type="submit" className="btn btn-danger">
            Supprimer cet achat
          </button>
        </form>
      </div>
    </div>
  );
}
