import type { TerminalContent } from "./content.ts";
import { plainText } from "./content.ts";
import { VirtualFilesystem, normalizePath } from "./filesystem.ts";
import { fastfetch } from "./Fastfetch.ts";
import { parseCommand } from "./parser.ts";

export const COMMANDS = [
  "help",
  "clear",
  "pwd",
  "ls",
  "cd",
  "cat",
  "echo",
  "whoami",
  "hostname",
  "uname",
  "date",
  "history",
  "tree",
  "fastfetch",
  "neofetch",
  "cmatrix",
  "projects",
  "skills",
  "contact",
  "github",
  "linkedin",
  "resume",
  "open",
  "theme",
  "exit",
  "sudo",
  "rm",
  "vim",
];
export type ShellAction =
  | { kind: "clear" | "exit" | "cmatrix" }
  | { kind: "open"; href: string }
  | { kind: "theme"; theme: "ink" | "paper" | "system" };
export type CommandResult = { output: string; action?: ShellAction };
export type CommandContext = {
  content: TerminalContent;
  fs: VirtualFilesystem;
  cwd: string;
  history: string[];
  theme: string;
  columns: number;
  now?: Date;
};

export function executeCommand(
  input: string,
  context: CommandContext,
): CommandResult {
  const { content, fs } = context;
  let words: string[];
  try {
    words = parseCommand(input);
  } catch (error) {
    return { output: `portfolio-sh: ${(error as Error).message}` };
  }
  const [command, ...args] = words;
  const result = (output = "", action?: ShellAction): CommandResult => ({
    output: plainText(output),
    action,
  });
  const error = (message: string) => result(`${command}: ${message}`);
  const destination = (name: string): CommandResult => {
    const project = content.projects.find(
      (entry) =>
        entry.slug === name || entry.title.toLowerCase() === name.toLowerCase(),
    );
    const href = project
      ? `/work/${project.slug}`
      : Object.hasOwn(content.links, name)
        ? content.links[name as keyof typeof content.links]
        : null;
    if (!href)
      return error(
        name === "resume"
          ? "No public résumé URL is available."
          : `Unknown or unavailable destination: ${name}`,
      );
    // Only validated portfolio destinations reach navigation; input is never a URL.
    return result(`Opening ${project?.title || name}…`, { kind: "open", href });
  };
  if (!command) return result();
  switch (command) {
    case "help":
      return result(
        "PORTFOLIO-SH / COMMANDS\n\nBrowse   ls [-la] [path], cd [path], pwd, cat <file>, tree [path]\nExplore  projects, skills, contact, fastfetch, neofetch\nOpen     open <project-slug|github|linkedin|resume>\nSystem   whoami, hostname, uname, date, echo, history\nDisplay  clear, theme [ink|paper|system], cmatrix, exit\n\n↑ ↓ history · Tab completion · Ctrl+C cancel · Ctrl+L clear\nHome / End edit · Escape close · Ctrl+~ toggle\n\nFiles are read-only portfolio content. Commands run only in this browser.",
      );
    case "clear":
      return result("", { kind: "clear" });
    case "exit":
      return result("", { kind: "exit" });
    case "pwd":
      return result(context.cwd);
    case "whoami":
      return result(content.user);
    case "hostname":
      return result(content.hostname);
    case "uname":
      return result(`${content.brand} / browser simulation / portfolio-sh`);
    case "date":
      return result(
        new Intl.DateTimeFormat("en-GB", {
          dateStyle: "full",
          timeStyle: "long",
          timeZone: content.timezone,
        }).format(context.now || new Date()),
      );
    case "echo":
      return result(args.join(" "));
    case "history":
      return result(
        context.history
          .map((entry, index) => `${String(index + 1).padStart(3)}  ${entry}`)
          .join("\n"),
      );
    case "ls": {
      const flags = args.filter((arg) => arg.startsWith("-"));
      if (flags.some((flag) => !/^-[la]+$/.test(flag)))
        return error("Supported flags: -l, -a, -la.");
      const paths = args.filter((arg) => !arg.startsWith("-"));
      if (paths.length > 1) return error("Usage: ls [-la] [path]");
      const path = paths[0] || ".";
      const entry = fs.get(path, context.cwd);
      if (!entry) return error(`No such file or directory: ${path}`);
      const entries =
        entry.kind === "file" ? [entry] : fs.list(path, context.cwd);
      return result(
        entries
          .map((item) => {
            const name = `${item.path.split("/").pop()}${item.kind === "directory" ? "/" : ""}`;
            return flags.some((flag) => flag.includes("l"))
              ? `${item.kind === "directory" ? "dr-xr-xr-x" : "-r--r--r--"}  ${content.user}  ${name}`
              : name;
          })
          .join(flags.some((flag) => flag.includes("l")) ? "\n" : "  "),
      );
    }
    case "cd": {
      if (args.length > 1) return error("Usage: cd [path]");
      const path = normalizePath(args[0] || "~", context.cwd, content.home);
      const entry = fs.get(path, context.cwd);
      if (!entry) return error(`No such directory: ${args[0]}`);
      if (entry.kind !== "directory")
        return error(`Not a directory: ${args[0]}`);
      context.cwd = path;
      return result();
    }
    case "cat": {
      if (!args.length) return error("Usage: cat <file> [file…]");
      return result(
        args
          .map((path) => {
            const entry = fs.get(path, context.cwd);
            return !entry
              ? `cat: No such file: ${path}`
              : entry.kind === "directory"
                ? `cat: Is a directory: ${path}`
                : entry.content;
          })
          .join("\n"),
      );
    }
    case "tree": {
      const path = args[0] || ".";
      if (fs.get(path, context.cwd)?.kind !== "directory")
        return error(`Not a directory: ${path}`);
      return result(fs.tree(path, context.cwd));
    }
    case "fastfetch":
    case "neofetch":
      return result(fastfetch(content, context.theme, context.columns));
    case "projects":
      return result(
        content.projects
          .filter((project) => project.featured)
          .map(
            (project, index) =>
              `${index + 1}. ${project.title}\n   ${project.summary}\n   /work/${project.slug}  → open ${project.slug}`,
          )
          .join("\n\n"),
      );
    case "skills":
      return result(
        content.skills
          .map((group) => `${group.name}\n${group.items.join(" · ")}`)
          .join("\n\n"),
      );
    case "contact":
      return result(
        content.contact || "No public contact information is available.",
      );
    case "github":
    case "linkedin":
    case "resume":
      return destination(command);
    case "open":
      return args.length
        ? destination(args.join(" "))
        : error("Usage: open <project-slug|github|linkedin|resume>");
    case "theme": {
      if (!args.length) return result(context.theme.toUpperCase());
      const theme = args[0].toLowerCase();
      return ["ink", "paper", "system"].includes(theme)
        ? result(`Theme: ${theme.toUpperCase()}`, {
            kind: "theme",
            theme: theme as "ink" | "paper" | "system",
          })
        : error("Usage: theme [ink|paper|system]");
    }
    case "cmatrix":
      return result("CMATRIX / Ctrl+C to stop", { kind: "cmatrix" });
    case "sudo":
      return result(
        `${content.user} is already in the sudoers file.\nThis incident will not be reported.`,
      );
    case "rm":
      return result("Nice try.\nFilesystem restored from portfolio.yaml.");
    case "vim":
      return result("You are already trapped inside it.");
    default:
      return result(
        `portfolio-sh: ${command}: command not found\nType \`help\` for available commands.`,
      );
  }
}
