import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateProduct, deleteProduct } from "@/lib/actions/stock";
import { ActionForm } from "@/components/ActionForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const [product, saveurs, formats] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { saveur: true, format: true },
    }),
    prisma.saveur.findMany({ orderBy: { name: "asc" } }),
    prisma.formatProduit.findMany({ orderBy: { volumeMl: "asc" } }),
  ]);
  if (!product) notFound();

  const updateAction = updateProduct.bind(null, product.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-brand">
            Modifier le produit
          </h1>
          <p className="mt-1 text-muted">{product.name}</p>
        </div>
        <Link href="/admin/products" className="btn btn-ghost !py-2 !px-4 text-sm">
          ← Retour
        </Link>
      </div>

      <div className="card-panel">
        <ActionForm action={updateAction} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Nom</label>
            <input name="name" required className="input" defaultValue={product.name} />
          </div>
          <div>
            <label className="label">Saveur</label>
            <select name="saveurId" className="input" required defaultValue={product.saveurId}>
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
            <select name="formatId" className="input" required defaultValue={product.formatId}>
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
            <label className="label">Coût unitaire production</label>
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
