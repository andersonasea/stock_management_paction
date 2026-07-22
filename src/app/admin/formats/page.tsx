import { prisma } from "@/lib/prisma";
import {
  createFormat,
  updateFormat,
  deleteFormat,
} from "@/lib/actions/stock";
import { ActionForm } from "@/components/ActionForm";

export default async function AdminFormatsPage() {
  const formats = await prisma.formatProduit.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { volumeMl: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-brand">
          Formats
        </h1>
        <p className="mt-1 text-muted">Créer, modifier et supprimer les formats</p>
      </div>

      <div className="card-panel">
        <h2 className="text-lg font-extrabold text-brand-deep">Nouveau format</h2>
        <ActionForm
          action={createFormat}
          className="mt-4 grid gap-3 sm:grid-cols-[1fr_140px_auto] sm:items-end"
        >
          <div>
            <label className="label">Nom</label>
            <input name="name" required className="input" placeholder="Ex: 1 L, 750 ml…" />
          </div>
          <div>
            <label className="label">Volume (ml)</label>
            <input name="volumeMl" type="number" min={1} className="input" placeholder="250" />
          </div>
          <button type="submit" className="btn btn-primary">
            Ajouter
          </button>
        </ActionForm>
      </div>

      <div className="space-y-4">
        {formats.map((f) => (
          <div key={f.id} className="card-panel">
            <ActionForm
              action={updateFormat.bind(null, f.id)}
              className="grid gap-3 sm:grid-cols-[1fr_120px_auto_auto] sm:items-end"
            >
              <div>
                <label className="label">Nom</label>
                <input name="name" required className="input" defaultValue={f.name} />
              </div>
              <div>
                <label className="label">Volume (ml)</label>
                <input
                  name="volumeMl"
                  type="number"
                  min={1}
                  className="input"
                  defaultValue={f.volumeMl ?? ""}
                />
              </div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  name="isActive"
                  value="true"
                  defaultChecked={f.isActive}
                  className="size-4 accent-[var(--brand-blue)]"
                />
                Actif
              </label>
              <button type="submit" className="btn btn-primary !py-2 !px-4 text-sm">
                Enregistrer
              </button>
            </ActionForm>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
              <span>
                {f._count.products} produit(s) · {f.isActive ? "visible" : "inactif"}
              </span>
              <form action={deleteFormat.bind(null, f.id)}>
                <button type="submit" className="btn btn-danger !py-1.5 !px-3 text-xs">
                  Supprimer
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
