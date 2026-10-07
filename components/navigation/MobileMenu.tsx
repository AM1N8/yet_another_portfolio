"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function MobileMenu({ children }: { children: ReactNode }) {
  const details = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !details.current?.contains(event.target)
      ) {
        if (details.current) details.current.open = false;
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && details.current?.open) {
        event.preventDefault();
        details.current.open = false;
        summary.current?.focus();
      }
    };
    const desktop = matchMedia("(min-width: 1200px)");
    const closeOnDesktop = () => {
      if (desktop.matches && details.current) details.current.open = false;
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, []);

  return (
    <details className="mobile-menu" ref={details}>
      <summary className="label" ref={summary} aria-label="Navigation menu">
        MENU
      </summary>
      <div
        className="mobile-menu-panel"
        onClick={(event) => {
          if (
            event.target instanceof Element &&
            event.target.closest("a") &&
            details.current
          )
            details.current.open = false;
        }}
      >
        {children}
        <p className="menu-note">
          Sections will become available as the portfolio is built.
        </p>
      </div>
    </details>
  );
}
