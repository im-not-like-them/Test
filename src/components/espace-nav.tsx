"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui";

export type NavItem = { href: string; label: string };

export function EspaceNav({ items }: { items: NavItem[] }) {
  // L'URL visible n'a pas le préfixe /sites/<site> ajouté par le middleware.
  const pathname = usePathname().replace(/^\/sites\/[^/]+/, "") || "/";
  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col">
      {items.map((item) => {
        const active = item.href === "/espace" ? pathname === "/espace" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cx(
              "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium",
              active ? "bg-brand/10 text-brand" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
