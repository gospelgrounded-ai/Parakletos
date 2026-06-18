import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AppSidebar from "@/components/layout/AppSidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden md:pl-16 lg:pl-[220px]">
        <main className="flex-1 overflow-y-auto">{children}</main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
