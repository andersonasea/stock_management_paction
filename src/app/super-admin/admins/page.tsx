import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAdmin, deleteAdmin } from "@/lib/actions/stock";
import { ActionForm } from "@/components/ActionForm";
import { ROLE_LABELS } from "@/lib/constants";

export default async function AdminsPage() {
  const session = await auth();
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-brand">
          Gestion des admins
        </h1>
        <p className="mt-1 text-muted">
          Créer, modifier et supprimer les comptes administrateurs
        </p>
      </div>

      <div className="card-panel">
        <h2 className="text-lg font-extrabold text-brand-deep">Nouvel admin</h2>
        <ActionForm action={createAdmin} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Nom</label>
            <input name="name" required className="input" />
          </div>
          <div>
            <label className="label">Email</label>
            <input name="email" type="email" required className="input" />
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input name="phone" className="input" />
          </div>
          <div>
            <label className="label">Mot de passe</label>
            <input name="password" type="password" minLength={6} required className="input" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn btn-primary">
              Créer l&apos;admin
            </button>
          </div>
        </ActionForm>
      </div>

      <div className="card-panel !p-0 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand/5">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3">Créé le</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => {
              const isSelf = session?.user?.id === a.id;
              return (
                <tr key={a.id} className="border-t border-border">
                  <td className="px-4 py-3 font-semibold">
                    {a.name}
                    {isSelf ? " (vous)" : ""}
                  </td>
                  <td className="px-4 py-3">{a.email}</td>
                  <td className="px-4 py-3">{ROLE_LABELS[a.role]}</td>
                  <td className="px-4 py-3">
                    {a.createdAt.toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/super-admin/admins/${a.id}`}
                        className="btn btn-ghost !py-1.5 !px-3 text-xs"
                      >
                        Modifier
                      </Link>
                      {!isSelf && (
                        <form action={deleteAdmin.bind(null, a.id)}>
                          <button
                            type="submit"
                            className="btn btn-danger !py-1.5 !px-3 text-xs"
                          >
                            Supprimer
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
