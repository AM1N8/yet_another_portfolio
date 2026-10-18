"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { subscribeTheme } from "@/lib/theme";

export function SignatureGraph({
  children,
  motionEnabled,
}: {
  children: ReactNode;
  motionEnabled: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pulse = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const element = host.current!;
    const bitmap = canvas.current!;
    const button = pulse.current!;
    let disposed = false;
    let visible = false;
    let loading = false;
    let renderer:
      | ReturnType<
          typeof import("@/lib/signature/renderer").createSignatureRenderer
        >
      | undefined;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (disposed) return;
      if (renderer) {
        renderer.setActive(visible && !document.hidden);
        return;
      }
      if (!visible || document.hidden || loading) return;
      loading = true;
      import("@/lib/signature/renderer")
        .then(({ createSignatureRenderer }) => {
          if (disposed) return;
          renderer = createSignatureRenderer(
            bitmap,
            motionEnabled && !motion.matches,
          );
          if (renderer) {
            element.dataset.enhanced = "true";
            sync();
          }
        })
        .catch(() => {
          /* The server-rendered SVG remains the complete visual fallback. */
        });
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(element);
    const resize = new ResizeObserver(() => renderer?.resize());
    resize.observe(element);
    const unsubscribeTheme = subscribeTheme(() => renderer?.refresh());
    const move = (event: PointerEvent) => {
      const bounds = bitmap.getBoundingClientRect();
      renderer?.point(event.clientX - bounds.left, event.clientY - bounds.top);
    };
    const leave = () => renderer?.point(null, null);
    const activate = () => renderer?.pulse();
    const reduce = () => renderer?.setMotion(motionEnabled && !motion.matches);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerleave", leave);
    button.addEventListener("click", activate);
    motion.addEventListener("change", reduce);
    document.addEventListener("visibilitychange", sync);
    const resizeWindow = () => renderer?.resize();
    window.addEventListener("resize", resizeWindow);
    return () => {
      disposed = true;
      observer.disconnect();
      resize.disconnect();
      unsubscribeTheme();
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", leave);
      button.removeEventListener("click", activate);
      motion.removeEventListener("change", reduce);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("resize", resizeWindow);
      renderer?.dispose();
    };
  }, [motionEnabled]);
  return (
    <div className="signature-stage" ref={host}>
      {children}
      <canvas ref={canvas} aria-hidden="true" className="signature-canvas" />
      <div className="signature-interaction">
        <span className="label text-muted">VECTOR / CELL FIELD</span>
        <button
          ref={pulse}
          type="button"
          className="signature-pulse label"
          aria-label="Pulse the CDXV point matrix"
        >
          Pulse matrix <span aria-hidden="true">↗</span>
        </button>
      </div>
    </div>
  );
}
