"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import type { ActivityModel } from "@/lib/activity/model";

// The import is deliberately inside the visibility callback: D3 and Canvas code
// must not compete with the hero's initial paint or hydration.
export function LazyActivity({ model }: { model: ActivityModel }) {
  const host = useRef<HTMLDivElement>(null);
  const [View, setView] = useState<ComponentType<{
    model: ActivityModel;
  }> | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let disposed = false;
    let loading = false;
    let nearby = false;
    let loaded: ComponentType<{ model: ActivityModel }> | null = null;
    const load = () => {
      if (disposed || !nearby || document.hidden) return;
      if (loaded) {
        setView(() => loaded);
        return;
      }
      if (loading) return;
      loading = true;
      import("./ActivityUniverse").then(
        ({ ActivityUniverse }) => {
          loaded = ActivityUniverse;
          load();
        },
        () => {
          if (!disposed) setFailed(true);
        },
      );
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        nearby = entry.isIntersecting;
        load();
      },
      { rootMargin: "100px" },
    );
    if (host.current) observer.observe(host.current);
    document.addEventListener("visibilitychange", load);
    return () => {
      disposed = true;
      observer.disconnect();
      document.removeEventListener("visibilitychange", load);
    };
  }, []);
  return (
    <div ref={host}>
      {View ? (
        <View model={model} />
      ) : (
        <div className="activity-deferred">
          <p className="text-muted">
            {failed
              ? "Interactive view is unavailable. All records remain in the text view below."
              : "The interactive view loads as it approaches the viewport. All records are available in the text view below."}
          </p>
        </div>
      )}
    </div>
  );
}
