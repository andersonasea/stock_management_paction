import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateAdmin, deleteAdmin } from "@/lib/actions/stock";
import { ActionForm } from "@/components/ActionForm";
import { ROLE_LABELS } from "@/lib/constants";

type Props = { params: Promise<{ id: string }> };

export default async function EditAdminPage({ params }: Props) {
  const session = await auth();
  const { id } = await params;

  const admin = await prisma.user.findUnique({ where: { id } });
  if (!admin || (admin.role !== "ADMIN" && admin.role !== "SUPER_ADMIN")) {
    notFound();
  }

  const isSelf = session?.user?.id === admin.id;
  const updateAction = updateAdmin.bind(null, admin.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-brand">
            Modifier l&apos;admin
          </h1>
          <p className="mt-1 text-muted">
            {admin.name} · {ROLE_LABELS[admin.role]}
          </p>
        </div>
        <Link
          href="/super-admin/admins"
          className="btn btn-ghost !py-2 !px-4 text-sm"
        >
          ← Retour
        </Link>
      </div>

      <div className="card-panel">
        <ActionForm action={updateAction} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Nom</label>
            <input name="name" required className="input" defaultValue={admin.name} />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              name="email"
              type="email"
              required
              className="input"
              defaultValue={admin.email}
            />
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input
              name="phone"
              className="input"
              defaultValue={admin.phone || ""}
            />
          </div>
          <div>
            <label className="label">Nouveau mot de passe</label>
            <input
              name="password"
              type="password"
              minLength={6}
              className="input"
              placeholder="Laisser vide pour ne pas changer"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Rôle</label>
            <select
              name="role"
              className="input"
              defaultValue={admin.role}
              disabled={isSelf && admin.role === "SUPER_ADMIN"}
            >
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
            {isSelf && admin.role === "SUPER_ADMIN" && (
              <input type="hidden" name="role" value="SUPER_ADMIN" />
            )}
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn btn-primary">
              Enregistrer
            </button>
          </div>
        </ActionForm>
      </div>

      {!isSelf && (
        <div className="card-panel border-danger/30">
          <h2 className="text-lg font-extrabold text-danger">Supprimer</h2>
          <p className="mt-1 text-sm text-muted">
            Si cet admin a déjà validé des commandes ou saisi des coûts, son
            compte sera rétrogradé en client plutôt que supprimé, pour garder
            l&apos;historique.
          </p>
          <form action={deleteAdmin.bind(null, admin.id)} className="mt-4">
            <button type="submit" className="btn btn-danger">
              Supprimer / rétrograder
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
