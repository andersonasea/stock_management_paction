import { prisma } from "@/lib/prisma";
import {
  createSaveur,
  updateSaveur,
  deleteSaveur,
} from "@/lib/actions/stock";
import { ActionForm } from "@/components/ActionForm";

export default async function AdminSaveursPage() {
  const saveurs = await prisma.saveur.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-brand">
          Saveurs
        </h1>
        <p className="mt-1 text-muted">Créer, modifier et supprimer les saveurs</p>
      </div>

      <div className="card-panel">
        <h2 className="text-lg font-extrabold text-brand-deep">Nouvelle saveur</h2>
        <ActionForm action={createSaveur} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="label">Nom</label>
            <input name="name" required className="input" placeholder="Ex: Fraise, Nature…" />
          </div>
          <button type="submit" className="btn btn-primary">
            Ajouter
          </button>
        </ActionForm>
      </div>

      <div className="space-y-4">
        {saveurs.map((s) => (
          <div key={s.id} className="card-panel">
            <ActionForm
              action={updateSaveur.bind(null, s.id)}
              className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end"
            >
              <div>
                <label className="label">Nom</label>
                <input name="name" required className="input" defaultValue={s.name} />
              </div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  name="isActive"
                  value="true"
                  defaultChecked={s.isActive}
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
                {s._count.products} produit(s) · {s.isActive ? "visible" : "inactif"}
              </span>
              <form action={deleteSaveur.bind(null, s.id)}>
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
