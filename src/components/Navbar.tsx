import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { logoutUser } from "@/lib/actions/auth";

export async function Navbar() {
  const session = await auth();
  const role = session?.user?.role;

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="group flex shrink-0 items-center">
          <Image
            src="/assets/paktion-logo.png"
            alt="PAktion"
            width={160}
            height={71}
            priority
            className="h-9 w-auto object-contain sm:h-10"
          />
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-2 text-sm font-medium">
          <Link href="/catalogue" className="rounded-full px-3 py-1.5 hover:bg-brand/5">
            Catalogue
          </Link>
          {session?.user ? (
            <>
              {role === "USER" && (
                <Link href="/orders" className="rounded-full px-3 py-1.5 hover:bg-brand/5">
                  Mes commandes
                </Link>
              )}
              {(role === "ADMIN" || role === "SUPER_ADMIN") && (
                <Link href="/admin" className="rounded-full px-3 py-1.5 hover:bg-brand/5">
                  Admin
                </Link>
              )}
              {role === "SUPER_ADMIN" && (
                <Link
                  href="/super-admin"
                  className="rounded-full px-3 py-1.5 hover:bg-brand/5"
                >
                  Super Admin
                </Link>
              )}
              <span className="hidden text-muted md:inline">{session.user.name}</span>
              <form action={logoutUser}>
                <button type="submit" className="btn btn-ghost !py-1.5 !px-3 text-sm">
                  Déconnexion
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-3 py-1.5 hover:bg-brand/5">
                Connexion
              </Link>
              <Link href="/register" className="btn btn-primary !py-1.5 !px-4 text-sm">
                Créer un compte
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
