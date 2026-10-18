import {
  THEME_NAMES,
  isThemePreference,
  type ThemeName,
  type ThemePreference,
} from "./themes/registry.ts";
export type Theme = ThemeName;
export type { ThemePreference } from "./themes/registry.ts";

export function initializeTheme(
  defaultTheme: ThemePreference,
  names: readonly string[],
) {
  let preference = defaultTheme;
  try {
    const stored = localStorage.getItem("portfolio-theme");
    if (stored && (names.includes(stored) || stored === "system")) {
      preference = stored as ThemePreference;
    }
  } catch {
    // System preferences still work when browser storage is unavailable.
  }
  const theme =
    preference === "system"
      ? matchMedia("(prefers-color-scheme: dark)").matches
        ? "ink"
        : "paper"
      : preference;
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.themePreference = preference;
}

export function getTheme(): Theme {
  const name = document.documentElement.dataset.theme;
  return THEME_NAMES.includes(name as Theme) ? (name as Theme) : "paper";
}

function applyPreference(preference: ThemePreference) {
  const root = document.documentElement;
  root.dataset.themePreference = preference;
  root.dataset.theme =
    preference === "system"
      ? matchMedia("(prefers-color-scheme: dark)").matches
        ? "ink"
        : "paper"
      : preference;
  window.dispatchEvent(new Event("portfolio-theme-change"));
}

export function setTheme(preference: ThemePreference) {
  applyPreference(preference);
  try {
    localStorage.setItem("portfolio-theme", preference);
  } catch {
    // The current session can switch themes even without persistent storage.
  }
}

export function toggleTheme() {
  setTheme(getTheme() === "ink" ? "paper" : "ink");
}

const listeners = new Set<() => void>();
let cleanupThemeEvents: (() => void) | undefined;
function connectThemeEvents() {
  const media = matchMedia("(prefers-color-scheme: dark)");
  const systemChanged = () => {
    if (document.documentElement.dataset.themePreference === "system") {
      applyPreference("system");
    }
  };
  const storageChanged = (event: StorageEvent) => {
    if (event.key !== "portfolio-theme" && event.key !== null) return;
    const stored = event.newValue;
    const fallback = document.documentElement.dataset
      .defaultTheme as ThemePreference;
    applyPreference(isThemePreference(stored) ? stored : fallback);
  };
  const notify = () => {
    for (const listener of listeners) listener();
  };
  window.addEventListener("portfolio-theme-change", notify);
  window.addEventListener("storage", storageChanged);
  media.addEventListener("change", systemChanged);
  return () => {
    window.removeEventListener("portfolio-theme-change", notify);
    window.removeEventListener("storage", storageChanged);
    media.removeEventListener("change", systemChanged);
  };
}
export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  cleanupThemeEvents ??= connectThemeEvents();
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      cleanupThemeEvents?.();
      cleanupThemeEvents = undefined;
    }
  };
}
