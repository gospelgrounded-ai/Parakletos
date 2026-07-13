import AppSidebar from "@/components/layout/AppSidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

/**
 * The authenticated app chrome: desktop sidebar (lg+) plus mobile bottom
 * nav (<lg), one nav per viewport. The `app-shell` class publishes
 * --shell-left / --shell-bottom (globals.css) for fixed-position bars.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell flex h-screen bg-background overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden lg:pl-[220px]">
        <main className="flex-1 overflow-y-auto">{children}</main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
