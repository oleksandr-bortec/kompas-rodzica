"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, CircleUser, Compass, FileText, LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/plan", label: "Plan", icon: Compass },
  { href: "/kalkulator", label: "Kalkulator", icon: Calculator },
  { href: "/dokumenty", label: "Dokumenty", icon: FileText },
  { href: "/pomoc", label: "Pomoc", icon: LifeBuoy },
  { href: "/profil", label: "Profil", icon: CircleUser },
] as const;

function useActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(href + "/");
}

/** Mobile: fixed bottom tab bar (hidden ≥ lg). */
export function BottomNav() {
  const isActive = useActive();
  return (
    <nav
      aria-label="Nawigacja główna"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-kr-border bg-kr-surface/95 backdrop-blur pb-safe lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 kr-caption transition-colors",
                  active ? "text-kr-primary" : "text-kr-text-2 hover:text-kr-text",
                )}
              >
                <Icon className="size-6" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Desktop: left sidebar (visible ≥ lg). */
export function SideNav() {
  const isActive = useActive();
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-kr-border bg-kr-surface px-4 py-6 lg:flex">
      <Link href="/" className="mb-8 flex items-center gap-2 px-2">
        <span className="grid size-9 place-items-center rounded-xl bg-kr-primary text-white">
          <Compass className="size-5" aria-hidden />
        </span>
        <span className="font-heading text-lg font-extrabold text-kr-primary-dark">
          Kompas Rodzica
        </span>
      </Link>
      <nav aria-label="Nawigacja główna">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-colors",
                    active
                      ? "bg-kr-tint text-kr-primary-dark"
                      : "text-kr-text-2 hover:bg-muted hover:text-kr-text",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
