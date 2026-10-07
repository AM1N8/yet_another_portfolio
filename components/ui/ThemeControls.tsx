"use client";

import { useSyncExternalStore } from "react";
import { getTheme, setTheme, subscribeTheme } from "@/lib/theme";

export function ThemeControls({
  labels,
}: {
  labels: { dark: string; light: string };
}) {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => null);
  return (
    <div className="theme-controls" role="group" aria-label="Color theme">
      <button
        type="button"
        data-theme-option="ink"
        aria-label={`Use ${labels.dark} theme`}
        aria-pressed={theme === "ink"}
        onClick={() => setTheme("ink")}
      >
        {labels.dark}
      </button>
      <span aria-hidden="true">/</span>
      <button
        type="button"
        data-theme-option="paper"
        aria-label={`Use ${labels.light} theme`}
        aria-pressed={theme === "paper"}
        onClick={() => setTheme("paper")}
      >
        {labels.light}
      </button>
    </div>
  );
}
