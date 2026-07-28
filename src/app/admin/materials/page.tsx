import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  formatPrice,
  MATERIAL_UNIT_LABELS,
} from "@/lib/constants";
import {
  createRawMaterial,
  deleteRawMaterial,
} from "@/lib/actions/materials";
import { ActionForm } from "@/components/ActionForm";

export default async function AdminMaterialsPage() {
  const materials = await prisma.rawMaterial.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-brand">
          Matières premières
        </h1>
        <p className="mt-1 text-muted">
          Stock et CUMP (coût unitaire moyen pondéré) — mis à jour à chaque achat
        </p>
      </div>

      <div className="card-panel">
        <h2 className="text-lg font-extrabold text-brand-deep">
          Nouvelle matière
        </h2>
        <ActionForm
          action={createRawMaterial}
          className="mt-4 grid gap-3 sm:grid-cols-3"
        >
          <div className="sm:col-span-2">
            <label className="label">Nom</label>
            <input
              name="name"
              required
              className="input"
              placeholder="Lait, sucre, pot 250 ml…"
            />
          </div>
          <div>
            <label className="label">Unité</label>
            <select name="unit" className="input" required defaultValue="PCS">
              <option value="L">Litre (L)</option>
              <option value="KG">Kilogramme (kg)</option>
              <option value="PCS">Pièce</option>
            </select>
          </div>
          <div className="sm:col-span-3">
            <button type="submit" className="btn btn-primary">
              Créer
            </button>
          </div>
        </ActionForm>
      </div>

      <div className="card-panel !p-0 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand/5 text-brand-deep">
            <tr>
              <th className="px-4 py-3">Matière</th>
              <th className="px-4 py-3">Unité</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">CUMP</th>
              <th className="px-4 py-3">Valeur stock</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => (
              <tr key={m.id} className="border-t border-border">
                <td className="px-4 py-3 font-semibold">{m.name}</td>
                <td className="px-4 py-3">{MATERIAL_UNIT_LABELS[m.unit]}</td>
                <td className="px-4 py-3">
                  {m.stockQuantity} {m.unit.toLowerCase()}
                </td>
                <td className="px-4 py-3">{formatPrice(m.unitCost)}</td>
                <td className="px-4 py-3 font-bold text-brand-deep">
                  {formatPrice(m.stockQuantity * m.unitCost)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`badge ${m.isActive ? "badge-delivered" : "badge-cancelled"}`}
                  >
                    {m.isActive ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/materials/${m.id}`}
                      className="btn btn-ghost !py-1.5 !px-3 text-xs"
                    >
                      Modifier
                    </Link>
                    <form action={deleteRawMaterial.bind(null, m.id)}>
                      <button
                        type="submit"
                        className="btn btn-danger !py-1.5 !px-3 text-xs"
                      >
                        Supprimer
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {materials.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted">
                  Aucune matière — créez-en une puis enregistrez un achat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
