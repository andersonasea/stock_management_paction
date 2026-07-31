"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import {
  LayoutDashboard,
  FileBarChart2,
  Package,
  Boxes,
  ShoppingBag,
  IceCream2,
  Ruler,
  Warehouse,
  Wallet,
  ClipboardList,
  TrendingUp,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

export type SidebarLink = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
};

export const adminSidebarLinks: SidebarLink[] = [
  { href: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/admin/reports", label: "Rapports", icon: FileBarChart2 },
  { href: "/admin/products", label: "Produits", icon: Package },
  { href: "/admin/materials", label: "Matières", icon: Boxes },
  { href: "/admin/purchases", label: "Achats", icon: ShoppingBag },
  { href: "/admin/saveurs", label: "Saveurs", icon: IceCream2 },
  { href: "/admin/formats", label: "Formats", icon: Ruler },
  { href: "/admin/stock", label: "Stock / Production", icon: Warehouse },
  { href: "/admin/costs", label: "Charges", icon: Wallet },
  { href: "/admin/orders", label: "Commandes", icon: ClipboardList },
];

export const superAdminSidebarLinks: SidebarLink[] = [
  { href: "/super-admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/super-admin/reports", label: "Rapports", icon: FileBarChart2 },
  { href: "/super-admin/trends", label: "Tendances", icon: TrendingUp },
  { href: "/super-admin/admins", label: "Admins", icon: Users },
];

type Props = {
  title: string;
  links: SidebarLink[];
  storageKey: string;
};

function isActive(pathname: string, href: string) {
  if (href === "/admin" || href === "/super-admin") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CollapsibleSidebar({ title, links, storageKey }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === "1") setCollapsed(true);
    } catch {
      // ignore
    }
    setReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storageKey, collapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [collapsed, ready, storageKey]);

  return (
    <aside
      className={`card-panel sticky top-20 h-fit transition-[width] duration-200 ${
        collapsed ? "w-[76px] px-2" : "w-[220px]"
      }`}
    >
      <div
        className={`flex items-center gap-2 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        {!collapsed && (
          <p className="font-[family-name:var(--font-display)] text-xl text-brand">
            {title}
          </p>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="rounded-xl p-2 text-brand hover:bg-brand/5"
          aria-label={collapsed ? "Ouvrir le menu" : "Réduire le menu"}
          title={collapsed ? "Ouvrir" : "Réduire"}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-5" strokeWidth={2} />
          ) : (
            <PanelLeftClose className="size-5" strokeWidth={2} />
          )}
        </button>
      </div>

      <nav className="mt-4 flex flex-col gap-1 text-sm font-semibold">
        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              title={link.label}
              className={`flex items-center gap-3 rounded-xl py-2 transition-colors ${
                collapsed ? "justify-center px-2" : "px-3"
              } ${
                active
                  ? "bg-brand !text-white"
                  : "text-brand-deep hover:bg-brand/5"
              }`}
            >
              <Icon className="size-5 shrink-0" strokeWidth={2} />
              {!collapsed && <span className="truncate">{link.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
