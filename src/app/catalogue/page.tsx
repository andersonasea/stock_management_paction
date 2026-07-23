import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/constants";
import { createOrder } from "@/lib/actions/stock";
import { ActionForm } from "@/components/ActionForm";

export default async function CataloguePage() {
  const session = await auth();
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      saveur: { isActive: true },
      format: { isActive: true },
    },
    include: { saveur: true, format: true },
    orderBy: [{ name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="animate-rise mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-brand">
          Catalogue
        </h1>
        <p className="mt-2 text-muted">
          Yaourts EsthyPyaourt · frais à Kinshasa
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
        {products.map((product) => (
          <article key={product.id} className="card-panel overflow-hidden !p-0 animate-rise">
            <div className="relative h-52 w-full">
              <Image
                src={product.imageUrl || "/assets/gallery-01.jpeg"}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="p-5">
              <div className="flex flex-wrap gap-2">
                <span className="badge badge-validated">{product.saveur.name}</span>
                <span className="badge badge-pending">{product.format.name}</span>
              </div>
              <h2 className="mt-3 text-xl font-extrabold text-brand-deep">
                {product.name}
              </h2>
              <p className="mt-1 text-sm text-muted">{product.description}</p>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-2xl font-extrabold text-brand">
                    {formatPrice(product.unitPrice)}
                  </p>
                  <p className="text-xs text-muted">
                    Stock : {product.stockQuantity}
                  </p>
                </div>
              </div>

              {session?.user?.role === "USER" ? (
                product.stockQuantity > 0 ? (
                  <ActionForm action={createOrder} className="mt-4 space-y-3">
                    <input type="hidden" name="productId" value={product.id} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="label">Quantité</label>
                        <input
                          name="quantity"
                          type="number"
                          min={1}
                          max={product.stockQuantity}
                          defaultValue={1}
                          className="input"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Téléphone</label>
                        <input
                          name="customerPhone"
                          className="input"
                          placeholder="+243 …"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="label">Adresse de livraison</label>
                      <input name="customerAddress" className="input" />
                    </div>
                    <button type="submit" className="btn btn-primary w-full">
                      Commander
                    </button>
                  </ActionForm>
                ) : (
                  <p className="mt-4 text-sm font-semibold text-danger">
                    Rupture de stock
                  </p>
                )
              ) : !session ? (
                <Link href="/login" className="btn btn-primary mt-4 inline-flex w-full">
                  Connectez-vous pour commander
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {products.length === 0 && (
        <p className="text-center text-muted">Aucun produit disponible pour le moment.</p>
      )}
    </div>
  );
}
