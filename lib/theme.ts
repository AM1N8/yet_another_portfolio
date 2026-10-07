export type Theme = "ink" | "paper";
export type ThemePreference = Theme | "system";

export function initializeTheme(defaultTheme: ThemePreference) {
  let preference = defaultTheme;
  try {
    const stored = localStorage.getItem("portfolio-theme");
    if (stored === "ink" || stored === "paper" || stored === "system") {
      preference = stored;
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
  return document.documentElement.dataset.theme === "ink" ? "ink" : "paper";
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

export function subscribeTheme(listener: () => void) {
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
    applyPreference(
      stored === "ink" || stored === "paper" || stored === "system"
        ? stored
        : fallback,
    );
  };
  window.addEventListener("portfolio-theme-change", listener);
  window.addEventListener("storage", storageChanged);
  media.addEventListener("change", systemChanged);
  return () => {
    window.removeEventListener("portfolio-theme-change", listener);
    window.removeEventListener("storage", storageChanged);
    media.removeEventListener("change", systemChanged);
  };
}
