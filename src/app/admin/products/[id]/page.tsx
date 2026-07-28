import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice, MATERIAL_UNIT_LABELS } from "@/lib/constants";
import { updateProduct, deleteProduct } from "@/lib/actions/stock";
import { addRecipeItem, removeRecipeItem } from "@/lib/actions/materials";
import { ActionForm } from "@/components/ActionForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const [product, saveurs, formats, materials] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        saveur: true,
        format: true,
        recipeItems: { include: { rawMaterial: true } },
      },
    }),
    prisma.saveur.findMany({ orderBy: { name: "asc" } }),
    prisma.formatProduit.findMany({ orderBy: { volumeMl: "asc" } }),
    prisma.rawMaterial.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!product) notFound();

  const updateAction = updateProduct.bind(null, product.id);
  const addRecipe = addRecipeItem.bind(null, product.id);

  const theoreticalCost = product.recipeItems.reduce(
    (sum, item) => sum + item.quantityPerUnit * item.rawMaterial.unitCost,
    0
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-brand">
            Modifier le produit
          </h1>
          <p className="mt-1 text-muted">{product.name}</p>
        </div>
        <Link
          href="/admin/products"
          className="btn btn-ghost !py-2 !px-4 text-sm"
        >
          ← Retour
        </Link>
      </div>

      <div className="card-panel">
        <ActionForm action={updateAction} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Nom</label>
            <input
              name="name"
              required
              className="input"
              defaultValue={product.name}
            />
          </div>
          <div>
            <label className="label">Saveur</label>
            <select
              name="saveurId"
              className="input"
              required
              defaultValue={product.saveurId}
            >
              {saveurs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {!s.isActive ? " (inactif)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Format</label>
            <select
              name="formatId"
              className="input"
              required
              defaultValue={product.formatId}
            >
              {formats.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                  {!f.isActive ? " (inactif)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Prix unitaire (CDF)</label>
            <input
              name="unitPrice"
              type="number"
              min={0}
              required
              className="input"
              defaultValue={product.unitPrice}
            />
          </div>
          <div>
            <label className="label">
              Dernier coût de revient (auto à la production)
            </label>
            <input
              name="productionCost"
              type="number"
              min={0}
              required
              className="input"
              defaultValue={product.productionCost}
            />
          </div>
          <div>
            <label className="label">Quantité en stock</label>
            <input
              name="stockQuantity"
              type="number"
              min={0}
              className="input"
              defaultValue={product.stockQuantity}
            />
          </div>
          <div>
            <label className="label">Photo (chemin /public)</label>
            <input
              name="imageUrl"
              className="input"
              defaultValue={product.imageUrl || "/assets/gallery-01.jpeg"}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea
              name="description"
              className="input min-h-20"
              defaultValue={product.description || ""}
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              value="true"
              defaultChecked={product.isActive}
              className="size-4 accent-[var(--brand-blue)]"
            />
            <label htmlFor="isActive" className="text-sm font-semibold">
              Produit actif (visible dans le catalogue)
            </label>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn btn-primary">
              Enregistrer les modifications
            </button>
          </div>
        </ActionForm>
      </div>

      <div className="card-panel space-y-4">
        <div>
          <h2 className="text-lg font-extrabold text-brand-deep">
            Recette (nomenclature)
          </h2>
          <p className="mt-1 text-sm text-muted">
            Quantité de chaque matière pour <strong>1 unité</strong> de produit.
            Coût théorique actuel :{" "}
            <strong>{formatPrice(theoreticalCost)}</strong>
          </p>
        </div>

        {product.recipeItems.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand/5">
                <tr>
                  <th className="px-3 py-2">Matière</th>
                  <th className="px-3 py-2">Qté / unité</th>
                  <th className="px-3 py-2">CUMP</th>
                  <th className="px-3 py-2">Coût ligne</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {product.recipeItems.map((item) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="px-3 py-2 font-semibold">
                      {item.rawMaterial.name}
                    </td>
                    <td className="px-3 py-2">
                      {item.quantityPerUnit}{" "}
                      {item.rawMaterial.unit.toLowerCase()}
                    </td>
                    <td className="px-3 py-2">
                      {formatPrice(item.rawMaterial.unitCost)}
                    </td>
                    <td className="px-3 py-2 font-bold">
                      {formatPrice(
                        item.quantityPerUnit * item.rawMaterial.unitCost
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <form
                        action={removeRecipeItem.bind(
                          null,
                          item.id,
                          product.id
                        )}
                      >
                        <button
                          type="submit"
                          className="btn btn-danger !py-1 !px-2 text-xs"
                        >
                          Retirer
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {materials.length === 0 ? (
          <p className="text-sm text-muted">
            Créez d&apos;abord des{" "}
            <Link href="/admin/materials" className="font-semibold text-brand">
              matières premières
            </Link>
            .
          </p>
        ) : (
          <ActionForm action={addRecipe} className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="label">Matière</label>
              <select name="rawMaterialId" required className="input">
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({MATERIAL_UNIT_LABELS[m.unit]}) — CUMP{" "}
                    {formatPrice(m.unitCost)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Qté pour 1 unité</label>
              <input
                name="quantityPerUnit"
                type="number"
                min={0.0001}
                step="any"
                required
                className="input"
                placeholder="ex. 0.25"
              />
            </div>
            <div className="sm:col-span-3">
              <button type="submit" className="btn btn-primary">
                Ajouter à la recette
              </button>
            </div>
          </ActionForm>
        )}
      </div>

      <div className="card-panel border-danger/30">
        <h2 className="text-lg font-extrabold text-danger">Zone dangereuse</h2>
        <p className="mt-1 text-sm text-muted">
          Si le produit a déjà des commandes, il sera désactivé pour garder
          l&apos;historique. Sinon, suppression définitive.
        </p>
        <form action={deleteProduct.bind(null, product.id)} className="mt-4">
          <button type="submit" className="btn btn-danger">
            Supprimer / désactiver
          </button>
        </form>
      </div>
    </div>
  );
}
