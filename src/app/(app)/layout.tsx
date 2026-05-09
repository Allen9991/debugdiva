import type { ReactNode } from "react";
import { AppSidebar } from "@/components/shell/AppSidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-desktop)" }}>
      <AppSidebar />
      <div style={{ flex: 1, minWidth: 0, background: "var(--bg)" }}>
        {children}
      </div>
    </div>
  );
}
