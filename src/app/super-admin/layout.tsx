import { ReactNode } from "react";
import {
  CollapsibleSidebar,
  superAdminSidebarLinks,
} from "@/components/CollapsibleSidebar";

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
      <CollapsibleSidebar
        title="Super Admin"
        links={superAdminSidebarLinks}
        storageKey="esthypyaourt-superadmin-sidebar-collapsed"
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
