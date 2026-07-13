"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  BookOpen,
  Search,
  Calendar,
  Bookmark,
  House,
  Menu,
  HandHeart,
  Brain,
  NotebookPen,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const TAB_LINKS = [
  { href: "/home", icon: House, label: "Home" },
  { href: "/bible", icon: BookOpen, label: "Read" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/plans", icon: Calendar, label: "Plans" },
] as const;

const MORE_LINKS = [
  { href: "/library", icon: Bookmark, label: "Library" },
  { href: "/prayer", icon: HandHeart, label: "Prayer" },
  { href: "/memorize", icon: Brain, label: "Memorize" },
  { href: "/sermon-notes", icon: NotebookPen, label: "Sermon Notes" },
  { href: "/settings", icon: Settings, label: "Settings" },
] as const;

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [moreOpen, setMoreOpen] = useState(false);

  const isRouteActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");
  const moreActive = MORE_LINKS.some(({ href }) => isRouteActive(href));

  // Close the sheet once navigation completes
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-40">
      <div className="flex items-stretch h-16">
        {TAB_LINKS.map(({ href, icon: Icon, label }) => {
          const isActive = isRouteActive(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors",
                isActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}

        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors",
                moreActive ? "text-primary font-medium" : "text-muted-foreground"
              )}
            >
              <Menu className="h-5 w-5" />
              <span>More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-xl px-4 pb-8">
            <SheetTitle className="sr-only">More</SheetTitle>
            <div className="flex items-center gap-3 py-3 border-b mb-2">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage
                  src={session?.user?.image ?? undefined}
                  alt={session?.user?.name ?? "User"}
                />
                <AvatarFallback className="text-sm">
                  {getInitials(session?.user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate">
                  {session?.user?.name ?? "User"}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {session?.user?.email ?? ""}
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              {MORE_LINKS.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 min-h-[48px] text-sm font-medium transition-colors",
                    isRouteActive(href)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span>{label}</span>
                </Link>
              ))}
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-3 rounded-lg px-3 min-h-[48px] text-sm font-medium text-destructive hover:bg-muted transition-colors text-left"
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                <span>Sign out</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
