"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function CdxvMorphCanvas({
  children,
  motionEnabled,
}: {
  children: ReactNode;
  motionEnabled: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = host.current!,
      bitmap = canvas.current!;
    let disposed = false,
      visible = false,
      loading = false,
      userPaused = false;
    let renderer: ReturnType<
      typeof import("@/lib/hero/morph").createMorphRenderer
    >;
    let resizeTimer: ReturnType<typeof setTimeout>;
    let dpr = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => {
      element.dataset.static = String(!motionEnabled || motion.matches);
      renderer?.setMotion(motionEnabled && !motion.matches && !userPaused);
      if (renderer && motionEnabled && !motion.matches) {
        element.setAttribute("role", "button");
        element.setAttribute("tabindex", "0");
        element.setAttribute(
          "aria-label",
          "Pause or resume the CDXV animation",
        );
        element.setAttribute("aria-pressed", String(userPaused));
      } else {
        for (const attribute of [
          "role",
          "tabindex",
          "aria-label",
          "aria-pressed",
        ])
          element.removeAttribute(attribute);
      }
    };
    const sync = () => {
      if (disposed) return;
      if (renderer) {
        renderer.setActive(visible && !document.hidden);
        return;
      }
      if (!visible || document.hidden || loading) return;
      loading = true;
      import("@/lib/hero/morph")
        .then(({ createMorphRenderer }) => {
          if (disposed) return;
          renderer = createMorphRenderer(
            bitmap,
            motionEnabled && !motion.matches && !userPaused,
          );
          if (renderer) {
            element.dataset.enhanced = "true";
            syncMotion();
            sync();
          }
        })
        .catch(() => {
          /* The static SVG remains available. */
        });
    };
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    intersection.observe(element);
    const resized = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => renderer?.resize(), 80);
    };
    const resize = new ResizeObserver(resized);
    resize.observe(element);
    const theme = new MutationObserver(() => renderer?.refresh());
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    const pause = () => {
      if (!renderer || !motionEnabled || motion.matches) return;
      userPaused = !userPaused;
      syncMotion();
    };
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== " " && event.key !== "Enter") return;
      event.preventDefault();
      pause();
    };
    const pointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const bounds = bitmap.getBoundingClientRect();
      if (!bounds.width) return;
      renderer?.setPointer({
        x: ((event.clientX - bounds.left) / bounds.width) * 480,
        y: ((event.clientY - bounds.top) / bounds.width) * 480,
      });
    };
    const pointerLeave = () => renderer?.setPointer(null);
    const changedDpr = () => {
      dpr.removeEventListener("change", changedDpr);
      dpr = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
      dpr.addEventListener("change", changedDpr);
      resized();
    };
    syncMotion();
    element.addEventListener("click", pause);
    element.addEventListener("keydown", keydown);
    bitmap.addEventListener("pointermove", pointerMove);
    bitmap.addEventListener("pointerleave", pointerLeave);
    bitmap.addEventListener("pointercancel", pointerLeave);
    motion.addEventListener("change", syncMotion);
    dpr.addEventListener("change", changedDpr);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("resize", resized);
    return () => {
      disposed = true;
      clearTimeout(resizeTimer);
      intersection.disconnect();
      resize.disconnect();
      theme.disconnect();
      element.removeEventListener("click", pause);
      element.removeEventListener("keydown", keydown);
      bitmap.removeEventListener("pointermove", pointerMove);
      bitmap.removeEventListener("pointerleave", pointerLeave);
      bitmap.removeEventListener("pointercancel", pointerLeave);
      motion.removeEventListener("change", syncMotion);
      dpr.removeEventListener("change", changedDpr);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("resize", resized);
      renderer?.dispose();
    };
  }, [motionEnabled]);
  return (
    <div className="hero-morph-stage" ref={host}>
      {children}
      <canvas ref={canvas} aria-hidden="true" className="hero-morph-canvas" />
    </div>
  );
}
