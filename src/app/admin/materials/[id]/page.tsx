import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice, MATERIAL_UNIT_LABELS } from "@/lib/constants";
import {
  updateRawMaterial,
  deleteRawMaterial,
} from "@/lib/actions/materials";
import { ActionForm } from "@/components/ActionForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditMaterialPage({ params }: Props) {
  const { id } = await params;
  const material = await prisma.rawMaterial.findUnique({ where: { id } });
  if (!material) notFound();

  const updateAction = updateRawMaterial.bind(null, material.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-brand">
            Modifier la matière
          </h1>
          <p className="mt-1 text-muted">{material.name}</p>
        </div>
        <Link
          href="/admin/materials"
          className="btn btn-ghost !py-2 !px-4 text-sm"
        >
          ← Retour
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card-panel">
          <p className="text-sm font-semibold text-muted">Stock</p>
          <p className="mt-2 text-2xl font-extrabold text-brand-deep">
            {material.stockQuantity} {material.unit.toLowerCase()}
          </p>
        </div>
        <div className="card-panel">
          <p className="text-sm font-semibold text-muted">CUMP</p>
          <p className="mt-2 text-2xl font-extrabold text-brand-deep">
            {formatPrice(material.unitCost)}
          </p>
        </div>
        <div className="card-panel">
          <p className="text-sm font-semibold text-muted">Valeur stock</p>
          <p className="mt-2 text-2xl font-extrabold text-brand-deep">
            {formatPrice(material.stockQuantity * material.unitCost)}
          </p>
        </div>
      </div>

      <div className="card-panel">
        <ActionForm action={updateAction} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Nom</label>
            <input
              name="name"
              required
              className="input"
              defaultValue={material.name}
            />
          </div>
          <div>
            <label className="label">Unité</label>
            <select
              name="unit"
              className="input"
              required
              defaultValue={material.unit}
            >
              {(Object.keys(MATERIAL_UNIT_LABELS) as Array<
                keyof typeof MATERIAL_UNIT_LABELS
              >).map((u) => (
                <option key={u} value={u}>
                  {MATERIAL_UNIT_LABELS[u]}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              value="true"
              defaultChecked={material.isActive}
              className="size-4 accent-[var(--brand-blue)]"
            />
            <label htmlFor="isActive" className="text-sm font-semibold">
              Matière active (disponible pour achats / recettes)
            </label>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn btn-primary">
              Enregistrer
            </button>
          </div>
        </ActionForm>
        <p className="mt-3 text-xs text-muted">
          Le stock et le CUMP se mettent à jour uniquement via les achats.
        </p>
      </div>

      <div className="card-panel border-danger/30">
        <h2 className="text-lg font-extrabold text-danger">Zone dangereuse</h2>
        <p className="mt-1 text-sm text-muted">
          Si la matière a des achats, recettes ou consommations, elle sera
          désactivée pour garder l&apos;historique. Sinon, suppression
          définitive.
        </p>
        <form
          action={deleteRawMaterial.bind(null, material.id)}
          className="mt-4"
        >
          <button type="submit" className="btn btn-danger">
            Supprimer / désactiver
          </button>
        </form>
      </div>
    </div>
  );
}
