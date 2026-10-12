"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

export function CdxvMorphCanvas({
  children,
  motionEnabled,
}: {
  children: ReactNode;
  motionEnabled: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const instructionsId = useId();
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
      renderer?.setMotion(motionEnabled && !motion.matches);
      if (renderer && motionEnabled && !motion.matches) {
        element.setAttribute("role", "button");
        element.setAttribute("tabindex", "0");
        element.setAttribute(
          "aria-label",
          "Create a shockwave in the CDXV animation",
        );
        element.setAttribute("aria-describedby", instructionsId);
        element.setAttribute(
          "aria-description",
          userPaused
            ? "Animation paused. Press Escape to resume."
            : "Animation running.",
        );
      } else {
        for (const attribute of [
          "role",
          "tabindex",
          "aria-label",
          "aria-describedby",
          "aria-description",
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
            motionEnabled && !motion.matches,
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
    const shockwave = (point: { x: number; y: number }) => {
      if (!renderer || !motionEnabled || motion.matches) return;
      userPaused = false;
      renderer.shockwave(point);
      syncMotion();
    };
    const clicked = (event: MouseEvent) => {
      const bounds = bitmap.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      shockwave(
        event.detail === 0 && event.clientX === 0 && event.clientY === 0
          ? { x: 240, y: 240 }
          : {
              x: ((event.clientX - bounds.left) / bounds.width) * 480,
              y: ((event.clientY - bounds.top) / bounds.height) * 480,
            },
      );
    };
    const keydown = (event: KeyboardEvent) => {
      if (!renderer || !motionEnabled || motion.matches || event.repeat) return;
      if (event.key === "Escape") {
        event.preventDefault();
        userPaused = !userPaused;
        renderer.setPaused(userPaused);
        syncMotion();
        return;
      }
      if (event.key !== " " && event.key !== "Enter") return;
      event.preventDefault();
      shockwave({ x: 240, y: 240 });
    };
    const pointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const bounds = bitmap.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      renderer?.setPointer({
        x: ((event.clientX - bounds.left) / bounds.width) * 480,
        y: ((event.clientY - bounds.top) / bounds.height) * 480,
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
    element.addEventListener("click", clicked);
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
      element.removeEventListener("click", clicked);
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
  }, [motionEnabled, instructionsId]);
  return (
    <div className="hero-morph-stage" ref={host}>
      {children}
      <canvas ref={canvas} aria-hidden="true" className="hero-morph-canvas" />
      <p className="sr-only" id={instructionsId}>
        Click or tap to push cells outward from that point. Enter or Space
        creates a centered shockwave. Escape pauses or resumes motion.
      </p>
    </div>
  );
}
