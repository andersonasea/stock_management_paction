import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/constants";
import { createProduct, deleteProduct } from "@/lib/actions/stock";
import { ActionForm } from "@/components/ActionForm";

export default async function AdminProductsPage() {
  const [products, saveurs, formats] = await Promise.all([
    prisma.product.findMany({
      include: { saveur: true, format: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.saveur.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.formatProduit.findMany({
      where: { isActive: true },
      orderBy: { volumeMl: "asc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-brand">
          Produits
        </h1>
        <p className="mt-1 text-muted">Création, modification et suppression</p>
      </div>

      <div className="card-panel">
        <h2 className="text-lg font-extrabold text-brand-deep">Nouveau produit</h2>
        {saveurs.length === 0 || formats.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Créez d&apos;abord au moins une{" "}
            <Link href="/admin/saveurs" className="font-semibold text-brand">
              saveur
            </Link>{" "}
            et un{" "}
            <Link href="/admin/formats" className="font-semibold text-brand">
              format
            </Link>
            .
          </p>
        ) : (
          <ActionForm action={createProduct} className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Nom</label>
              <input name="name" required className="input" placeholder="EsthyPyaourt …" />
            </div>
            <div>
              <label className="label">Saveur</label>
              <select name="saveurId" className="input" required>
                {saveurs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Format</label>
              <select name="formatId" className="input" required>
                {formats.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Prix unitaire (CDF)</label>
              <input name="unitPrice" type="number" min={0} required className="input" />
            </div>
            <div>
              <label className="label">Coût unitaire production</label>
              <input name="productionCost" type="number" min={0} required className="input" />
            </div>
            <div>
              <label className="label">Quantité initiale</label>
              <input name="stockQuantity" type="number" min={0} defaultValue={0} className="input" />
            </div>
            <div>
              <label className="label">Photo (chemin /public)</label>
              <input
                name="imageUrl"
                className="input"
                placeholder="/banner.jpg"
                defaultValue="/banner.jpg"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea name="description" className="input min-h-20" />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn btn-primary">
                Créer le produit
              </button>
            </div>
          </ActionForm>
        )}
      </div>

      <div className="overflow-x-auto card-panel !p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand/5 text-brand-deep">
            <tr>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Saveur</th>
              <th className="px-4 py-3">Format</th>
              <th className="px-4 py-3">Prix</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3 font-semibold">{p.name}</td>
                <td className="px-4 py-3">{p.saveur.name}</td>
                <td className="px-4 py-3">{p.format.name}</td>
                <td className="px-4 py-3">{formatPrice(p.unitPrice)}</td>
                <td className="px-4 py-3">{p.stockQuantity}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${p.isActive ? "badge-delivered" : "badge-cancelled"}`}>
                    {p.isActive ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="btn btn-ghost !py-1.5 !px-3 text-xs"
                    >
                      Modifier
                    </Link>
                    <form action={deleteProduct.bind(null, p.id)}>
                      <button type="submit" className="btn btn-danger !py-1.5 !px-3 text-xs">
                        Supprimer
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
