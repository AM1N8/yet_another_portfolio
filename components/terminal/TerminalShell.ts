import type { TerminalContent } from "./content.ts";
import { plainText } from "./content.ts";
import {
  COMMANDS,
  executeCommand,
  type CommandContext,
  type ShellAction,
} from "./commands.ts";
import { VirtualFilesystem } from "./filesystem.ts";

export type ShellScreen = {
  cols: number;
  write: (text: string) => void;
  clear: () => void;
};

export class TerminalShell {
  readonly context: CommandContext;
  private input = "";
  private cursor = 0;
  private historyIndex = 0;
  private draft = "";
  private interactive = false;
  private screen: ShellScreen;
  private action: (action: ShellAction) => void;
  private theme: () => string;
  constructor(
    screen: ShellScreen,
    content: TerminalContent,
    action: (action: ShellAction) => void,
    theme: () => string,
  ) {
    this.screen = screen;
    this.action = action;
    this.theme = theme;
    this.context = {
      content,
      fs: new VirtualFilesystem(content),
      cwd: content.home,
      history: [],
      theme: theme(),
      columns: screen.cols,
    };
  }
  start() {
    this.print(
      `${this.context.content.brand} / PORTFOLIO-SH\nType help to explore. Tab completes paths and commands.\n`,
    );
    this.redraw();
  }
  private print(text: string) {
    this.screen.write(plainText(text).replace(/\r?\n/g, "\r\n") + "\r\n");
  }
  redraw() {
    if (this.interactive) return;
    this.context.columns = this.screen.cols;
    const { content, cwd } = this.context;
    const path =
      cwd === content.home
        ? "~"
        : cwd.startsWith(`${content.home}/`)
          ? `~${cwd.slice(content.home.length)}`
          : cwd;
    const prefix = `${content.brand} ${path} $ `;
    const prompt =
      prefix.length > this.screen.cols - 12 ? `${content.brand} … $ ` : prefix;
    const capacity = Math.max(4, this.screen.cols - prompt.length - 1);
    const start = Math.max(0, this.cursor - capacity);
    const visible = this.input.slice(start, start + capacity);
    const tail = Math.max(0, visible.length - (this.cursor - start));
    this.screen.write(
      `\r\x1b[2K\x1b[32m${prompt}\x1b[0m${visible}${tail ? `\x1b[${tail}D` : ""}`,
    );
  }
  cancel() {
    this.input = "";
    this.cursor = 0;
    this.historyIndex = this.context.history.length;
    if (this.interactive) return;
    this.screen.write("^C\r\n");
    this.redraw();
  }
  finishProgram() {
    this.interactive = false;
    this.screen.write("^C\r\n");
    this.redraw();
  }
  complete() {
    const before = this.input.slice(0, this.cursor);
    const match = before.match(/(?:^|\s)([^\s]*)$/);
    if (!match) return;
    const prefix = match[1];
    const command = before.trimStart().split(/\s/)[0];
    const first = !before.slice(0, before.length - prefix.length).trim();
    const candidates = first
      ? COMMANDS.filter((name) => name.startsWith(prefix))
      : command === "open"
        ? [
            ...this.context.content.projects.map((project) => project.slug),
            "github",
            "linkedin",
            "resume",
          ].filter((name) => name.startsWith(prefix))
        : this.context.fs.complete(prefix, this.context.cwd, command === "cd");
    if (candidates.length === 1) {
      const replacement =
        candidates[0] + (candidates[0].endsWith("/") ? "" : " ");
      this.input =
        before.slice(0, before.length - prefix.length) +
        replacement +
        this.input.slice(this.cursor);
      this.cursor += replacement.length - prefix.length;
    } else if (candidates.length) {
      this.screen.write("\r\n");
      this.print(candidates.join("  "));
    }
    this.redraw();
  }
  accept(data: string) {
    if (this.interactive) return;
    if (data === "\r") {
      const input = this.input;
      this.screen.write("\r\n");
      if (input.trim()) {
        this.context.history.push(input);
        if (this.context.history.length > 200) this.context.history.shift();
      }
      this.input = "";
      this.cursor = 0;
      this.historyIndex = this.context.history.length;
      this.draft = "";
      this.context.theme = this.theme();
      this.context.columns = this.screen.cols;
      const result = executeCommand(input, this.context);
      if (result.output) this.print(result.output);
      if (result.action?.kind === "cmatrix") this.interactive = true;
      if (result.action) this.action(result.action);
      if (result.action?.kind !== "exit") this.redraw();
      return;
    }
    if (data === "\x03") {
      this.cancel();
      return;
    }
    if (data === "\x0c") {
      this.screen.clear();
      this.redraw();
      return;
    }
    if (data === "\t") {
      this.complete();
      return;
    }
    if (data === "\x1b[A" || data === "\x1b[B") {
      if (this.historyIndex === this.context.history.length)
        this.draft = this.input;
      this.historyIndex = Math.max(
        0,
        Math.min(
          this.context.history.length,
          this.historyIndex + (data === "\x1b[A" ? -1 : 1),
        ),
      );
      this.input = this.context.history[this.historyIndex] ?? this.draft;
      this.cursor = this.input.length;
    } else if (data === "\x1b[D") this.cursor = Math.max(0, this.cursor - 1);
    else if (data === "\x1b[C")
      this.cursor = Math.min(this.input.length, this.cursor + 1);
    else if (["\x1b[H", "\x1b[1~", "\x1bOH", "\x01"].includes(data))
      this.cursor = 0;
    else if (["\x1b[F", "\x1b[4~", "\x1bOF", "\x05"].includes(data))
      this.cursor = this.input.length;
    else if (data === "\x7f" || data === "\b") {
      if (this.cursor) {
        this.input =
          this.input.slice(0, this.cursor - 1) + this.input.slice(this.cursor);
        this.cursor--;
      }
    } else if (data === "\x1b[3~")
      this.input =
        this.input.slice(0, this.cursor) + this.input.slice(this.cursor + 1);
    else if (!data.startsWith("\x1b")) {
      // Pasted multiline text is one editable command, never auto-executed.
      const text = plainText(data).replace(/[\r\n\t]/g, " ");
      if (this.input.length + text.length <= 4096) {
        this.input =
          this.input.slice(0, this.cursor) +
          text +
          this.input.slice(this.cursor);
        this.cursor += text.length;
      }
    }
    this.redraw();
  }
}
