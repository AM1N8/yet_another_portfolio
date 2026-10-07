"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import type { NavigationItem } from "@/lib/shell";

export function NavigationLinks({ items }: { items: NavigationItem[] }) {
  const pathname = usePathname();
  return (
    <ul className="navigation-list">
      {items.map((item, index) => (
        <li key={item.href}>
          {item.available ? (
            <Link
              className="navigation-link label"
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              <span className="navigation-index" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              {item.label}
            </Link>
          ) : (
            <span
              className="navigation-link label"
              aria-disabled="true"
              title="Available when this section is implemented"
            >
              <span className="navigation-index" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              {item.label}
              <span className="sr-only"> — section not available yet</span>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
