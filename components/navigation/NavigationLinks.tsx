"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { NavigationItem } from "@/lib/shell";

export function NavigationLinks({ items }: { items: NavigationItem[] }) {
  const pathname = usePathname();
  const [sectionHref, setSectionHref] = useState<string | null>(null);

  useEffect(() => {
    if (pathname !== "/") return;

    const sections = items.flatMap((item) => {
      if (!item.available) return [];
      const id =
        item.href === "/" ? "home" : item.href.match(/^\/?#([\w-]+)$/)?.[1];
      const element = id ? document.getElementById(id) : null;
      return element ? [{ href: item.href, element }] : [];
    });
    const header = document.querySelector(".site-header");
    let frame = 0;
    const update = () => {
      frame = 0;
      // Use a reading line below the sticky header, rather than visibility
      // ratios: a long Work section should remain active throughout its content.
      const readingLine = Math.max(
        (header?.getBoundingClientRect().bottom ?? 0) + 24,
        innerHeight * 0.25,
      );
      const ordered = sections
        .map((section) => ({
          ...section,
          top: section.element.getBoundingClientRect().top,
        }))
        .sort((a, b) => a.top - b.top);
      let active = ordered[0];
      for (const section of ordered) {
        if (section.top <= readingLine) active = section;
      }
      // Short final sections cannot always reach the reading line.
      if (
        scrollY > 0 &&
        Math.ceil(scrollY + innerHeight) >=
          document.documentElement.scrollHeight - 2
      )
        active = ordered[ordered.length - 1];
      setSectionHref(active?.href ?? null);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(schedule);
    const main = document.querySelector("main");
    if (main) observer.observe(main);
    if (header) observer.observe(header);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    window.addEventListener("pageshow", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
      window.removeEventListener("pageshow", schedule);
    };
  }, [items, pathname]);

  const activeHref =
    pathname === "/"
      ? (sectionHref ?? "/")
      : items.find(
          (item) =>
            item.available &&
            (item.href === pathname ||
              (item.href.startsWith("/#") &&
                pathname.startsWith(`/${item.href.slice(2)}/`))),
        )?.href;
  return (
    <ul className="navigation-list">
      {items.map((item, index) => (
        <li key={item.href}>
          {item.available ? (
            <Link
              className="navigation-link label"
              href={item.href}
              aria-current={
                activeHref === item.href
                  ? item.href === pathname
                    ? "page"
                    : "location"
                  : undefined
              }
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
