"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Search, Calendar, Bookmark, House, NotebookPen } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/home", icon: House, label: "Home" },
  { href: "/bible", icon: BookOpen, label: "Read" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/plans", icon: Calendar, label: "Plans" },
  { href: "/library", icon: Bookmark, label: "Library" },
  { href: "/sermon-notes", icon: NotebookPen, label: "Notes" },
] as const;

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-40">
      <div className="flex items-stretch h-16">
        {NAV_LINKS.map(({ href, icon: Icon, label }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");

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
      </div>
    </nav>
  );
}
