import { ReactNode } from "react";
import {
  CollapsibleSidebar,
  adminSidebarLinks,
} from "@/components/CollapsibleSidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
      <CollapsibleSidebar
        title="Admin"
        links={adminSidebarLinks}
        storageKey="esthypyaourt-admin-sidebar-collapsed"
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
