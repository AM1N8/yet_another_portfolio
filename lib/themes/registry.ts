export const THEMES = [
  { name: "ink", label: "Default dark", hidden: false, aliases: [] },
  { name: "paper", label: "Default light", hidden: false, aliases: [] },
  {
    name: "catppuccin",
    label: "Catppuccin Mocha",
    hidden: true,
    aliases: ["cat", "mocha"],
  },
  {
    name: "tokyonight",
    label: "Tokyo Night",
    hidden: true,
    aliases: ["tokyo", "tn"],
  },
  { name: "ayu", label: "Ayu Mirage", hidden: true, aliases: ["ayu-mirage"] },
  {
    name: "gruvbox",
    label: "Gruvbox Dark",
    hidden: true,
    aliases: ["gruv", "gruvbox-dark"],
  },
] as const;
export type ThemeName = (typeof THEMES)[number]["name"];
export type ThemePreference = ThemeName | "system";
export const THEME_NAMES: readonly ThemeName[] = THEMES.map(
  (theme) => theme.name,
);
export function resolveThemeName(value: string): ThemeName | undefined {
  return THEMES.find(
    (theme) =>
      theme.name === value ||
      (theme.aliases as readonly string[]).includes(value),
  )?.name;
}
export function isThemePreference(value: unknown): value is ThemePreference {
  return (
    typeof value === "string" &&
    (value === "system" || THEME_NAMES.includes(value as ThemeName))
  );
}
