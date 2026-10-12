import type { TerminalContent, VirtualEntry } from "./content.ts";

export function normalizePath(path: string, cwd: string, home: string): string {
  const expanded =
    path === "~" ? home : path.startsWith("~/") ? home + path.slice(1) : path;
  const parts: string[] = [];
  for (const part of (expanded.startsWith("/")
    ? expanded
    : `${cwd}/${expanded}`
  ).split("/")) {
    if (part === "..") parts.pop();
    else if (part && part !== ".") parts.push(part);
  }
  return `/${parts.join("/")}`;
}

export class VirtualFilesystem {
  readonly home: string;
  private entries: Map<string, VirtualEntry>;
  constructor(content: Pick<TerminalContent, "home" | "files">) {
    this.home = content.home;
    this.entries = new Map(content.files.map((entry) => [entry.path, entry]));
  }
  get(path: string, cwd: string) {
    return this.entries.get(normalizePath(path, cwd, this.home));
  }
  list(path: string, cwd: string): VirtualEntry[] {
    const resolved = normalizePath(path, cwd, this.home);
    const prefix = resolved === "/" ? "/" : `${resolved}/`;
    return [...this.entries.values()].filter(
      (entry) =>
        entry.path.startsWith(prefix) &&
        entry.path !== resolved &&
        !entry.path.slice(prefix.length).includes("/"),
    );
  }
  tree(path: string, cwd: string): string {
    const root = normalizePath(path, cwd, this.home);
    const lines = [root];
    const walk = (directory: string, prefix: string) => {
      const children = this.list(directory, cwd);
      children.forEach((entry, index) => {
        const last = index === children.length - 1;
        lines.push(
          `${prefix}${last ? "└──" : "├──"} ${entry.path.split("/").pop()}${entry.kind === "directory" ? "/" : ""}`,
        );
        if (entry.kind === "directory")
          walk(entry.path, `${prefix}${last ? "    " : "│   "}`);
      });
    };
    walk(root, "");
    return lines.join("\n");
  }
  complete(prefix: string, cwd: string, directoriesOnly = false): string[] {
    const slash = prefix.lastIndexOf("/");
    const parent = slash >= 0 ? prefix.slice(0, slash + 1) : "";
    const leaf = prefix.slice(slash + 1);
    return this.list(parent || ".", cwd)
      .filter(
        (entry) =>
          (!directoriesOnly || entry.kind === "directory") &&
          entry.path.split("/").pop()!.startsWith(leaf),
      )
      .map(
        (entry) =>
          `${parent}${entry.path.split("/").pop()}${entry.kind === "directory" ? "/" : ""}`,
      );
  }
}
