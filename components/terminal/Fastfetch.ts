import type { TerminalContent } from "./content.ts";

export function fastfetch(
  content: TerminalContent,
  theme: string,
  columns: number,
): string {
  const art =
    columns >= 70
      ? [
          "  ####  ####  #   #  #   #",
          " #      #   #  # #   #   #",
          " #      #   #   #    #   #",
          " #      #   #  # #    # # ",
          "  ####  ####  #   #    #  ",
        ]
      : ["┌──────────┐", "│ C D X V  │", "└──────────┘"];
  const github = content.links.github
    ? new URL(content.links.github).pathname.split("/").filter(Boolean)[0]
    : null;
  const rows = [
    ["user", content.fullName],
    ["role", content.role],
    ["host", content.brand],
    ["location", content.location],
    ["education", content.education.join(" × ")],
    ["focus", content.focus.join(" · ")],
    ["shell", "portfolio-sh"],
    ["theme", theme.toUpperCase()],
    ["github", github],
  ]
    .filter((row) => row[1])
    .map(([label, value]) => `${label!.padEnd(11)} ${value}`);
  return `${art.join("\n")}\n\n${rows.join("\n")}`;
}
