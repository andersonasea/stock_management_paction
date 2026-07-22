import Link from "next/link";
import { ReactNode } from "react";

const links = [
  { href: "/admin", label: "Vue d'ensemble" },
  { href: "/admin/products", label: "Produits" },
  { href: "/admin/saveurs", label: "Saveurs" },
  { href: "/admin/formats", label: "Formats" },
  { href: "/admin/stock", label: "Stock / Production" },
  { href: "/admin/costs", label: "Coûts" },
  { href: "/admin/orders", label: "Commandes" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[220px_1fr]">
      <aside className="card-panel h-fit">
        <p className="font-[family-name:var(--font-display)] text-xl text-brand">
          Admin
        </p>
        <nav className="mt-4 flex flex-col gap-1 text-sm font-semibold">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl px-3 py-2 hover:bg-brand/5"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  );
}
