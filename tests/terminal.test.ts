import test from "node:test";
import assert from "node:assert/strict";
import { loadPortfolio } from "../lib/content/loadPortfolio.ts";
import { createTerminalContent } from "../components/terminal/content.ts";
import {
  normalizePath,
  VirtualFilesystem,
} from "../components/terminal/filesystem.ts";
import { parseCommand } from "../components/terminal/parser.ts";
import {
  executeCommand,
  type CommandContext,
} from "../components/terminal/commands.ts";
import { TerminalShell } from "../components/terminal/TerminalShell.ts";
import { startCmatrix } from "../components/terminal/Cmatrix.ts";

const portfolio = loadPortfolio();
const content = createTerminalContent(portfolio);
function context(): CommandContext {
  return {
    content,
    fs: new VirtualFilesystem(content),
    cwd: content.home,
    history: [],
    theme: "paper",
    columns: 90,
  };
}

test("virtual filesystem resolves home, relative parents and root without accessing the host", () => {
  const ctx = context();
  assert.equal(
    normalizePath("~/projects/../skills/./", "/etc", content.home),
    `${content.home}/skills`,
  );
  assert.equal(
    normalizePath("../../../../etc/hostname", content.home, content.home),
    "/etc/hostname",
  );
  assert.equal(normalizePath("../../..", "/", content.home), "/");
  assert.match(executeCommand("ls -la", ctx).output, /dr-xr-xr-x.*projects\//);
  assert.equal(executeCommand("cd projects/noor-alerts", ctx).output, "");
  assert.equal(
    executeCommand("pwd", ctx).output,
    `${content.home}/projects/noor-alerts`,
  );
  assert.match(
    executeCommand("cat README.md", ctx).output,
    new RegExp(portfolio.projects.entries[0].title),
  );
  executeCommand("cd ..", ctx);
  assert.equal(ctx.cwd, `${content.home}/projects`);
  executeCommand("cd ~", ctx);
  assert.equal(ctx.cwd, content.home);
  executeCommand("cd /etc", ctx);
  assert.equal(executeCommand("cat hostname", ctx).output, content.hostname);
  assert.match(executeCommand("cd hostname", ctx).output, /Not a directory/);
  assert.equal(ctx.cwd, "/etc");
  assert.match(executeCommand("cat /etc/passwd", ctx).output, /No such file/);
  assert.match(executeCommand("tree ~", ctx).output, /README.md/);
});

test("commands use real public content, quote parsing and allowlisted navigation only", () => {
  const ctx = context();
  assert.deepEqual(parseCommand("echo \"hello world\" 'literal $HOME'"), [
    "echo",
    "hello world",
    "literal $HOME",
  ]);
  assert.equal(executeCommand('echo "hello world"', ctx).output, "hello world");
  assert.match(
    executeCommand('echo "unfinished', ctx).output,
    /Unclosed quote/,
  );
  assert.match(
    executeCommand("missing-command", ctx).output,
    /command not found.*\nType `help`/,
  );
  assert.equal(executeCommand("whoami", ctx).output, content.user);
  assert.equal(executeCommand("open noor-alerts", ctx).action?.kind, "open");
  assert.deepEqual(executeCommand("open noor-alerts", ctx).action, {
    kind: "open",
    href: "/work/noor-alerts",
  });
  for (const input of [
    "open https://example.com",
    "open constructor",
    "open __proto__",
    "open ../../etc",
  ])
    assert.equal(executeCommand(input, ctx).action, undefined);
  assert.deepEqual(executeCommand("resume", ctx).action, {
    kind: "open",
    href: portfolio.contact.resume.url,
  });
  assert.deepEqual(executeCommand("github", ctx).action, {
    kind: "open",
    href: portfolio.contact.links.github,
  });
  assert.match(executeCommand("projects", ctx).output, /1\. Noor Alerts/);
  assert.match(executeCommand("skills", ctx).output, /Python/);
  assert.ok(
    !executeCommand("contact", ctx).output.includes(
      portfolio.contact.phone || "PRIVATE_PHONE",
    ),
  );
  for (const command of ["fastfetch", "neofetch"]) {
    const output = executeCommand(command, ctx).output;
    assert.ok(output.includes(portfolio.identity.full_name));
    assert.ok(output.includes(portfolio.identity.headline));
    assert.ok(output.includes("PAPER"));
    assert.ok(output.includes("AM1N8"));
  }
  ctx.columns = 35;
  assert.match(executeCommand("fastfetch", ctx).output, /C D X V/);
  const hidden = structuredClone(portfolio);
  hidden.contact.email_public = false;
  hidden.contact.phone_public = false;
  hidden.identity.location.show_on_site = false;
  hidden.projects.entries[0].visible = false;
  const filtered = createTerminalContent(hidden);
  const serialized = JSON.stringify(filtered);
  assert.ok(!serialized.includes(hidden.contact.email));
  assert.ok(!serialized.includes('"slug":"noor-alerts"'));
  assert.ok(!serialized.includes("GITHUB_TOKEN"));
  assert.equal(filtered.location, null);
});

test("line editor completes commands and paths, edits input and maintains bounded history", () => {
  let output = "";
  let clears = 0;
  const shell = new TerminalShell(
    {
      cols: 80,
      write: (value) => {
        output += value;
      },
      clear: () => {
        clears++;
      },
    },
    content,
    () => {},
    () => "ink",
  );
  shell.start();
  shell.accept("pw");
  shell.accept("\t");
  shell.accept("\r");
  assert.equal(shell.context.history[0], "pwd ");
  assert.ok(output.includes(content.home));
  shell.accept("cd pro");
  shell.accept("\t");
  shell.accept("\r");
  assert.equal(shell.context.cwd, `${content.home}/projects`);
  shell.accept("cd ..");
  shell.accept("\r");
  shell.accept("echo abc");
  shell.accept("\x1b[D");
  shell.accept("\x7f");
  shell.accept("B");
  shell.accept("\x1b[F");
  shell.accept("\r");
  assert.ok(output.includes("aBc"));
  shell.accept("history");
  shell.accept("\r");
  assert.ok(output.includes("5  history"));
  shell.accept("\x1b[A");
  shell.accept("\r");
  assert.equal(shell.context.history.at(-1), "history");
  shell.accept("cancel me");
  shell.accept("\x03");
  shell.accept("\x0c");
  assert.equal(clears, 1);
  assert.ok(!shell.context.history.includes("cancel me"));
  shell.accept("echo first\nrm -rf /");
  shell.accept("\r");
  assert.equal(shell.context.history.at(-1), "echo first rm -rf /");
});

test("cmatrix owns one bounded timer and releases it when hidden, reduced or disposed", () => {
  const originalDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    "document",
  );
  const originalSet = globalThis.setTimeout;
  const originalClear = globalThis.clearTimeout;
  const pending = new Map<number, () => void>();
  let next = 0,
    writes = 0;
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { hidden: false },
  });
  globalThis.setTimeout = ((callback: () => void) => {
    pending.set(++next, callback);
    return next;
  }) as unknown as typeof setTimeout;
  globalThis.clearTimeout = ((id: number) => {
    pending.delete(id);
  }) as unknown as typeof clearTimeout;
  try {
    const runner = startCmatrix(
      {
        cols: 300,
        rows: 100,
        write: (text) => {
          assert.ok(text.length < 5000);
          writes++;
        },
      },
      false,
    );
    assert.equal(pending.size, 1);
    runner.setVisible(false);
    assert.equal(pending.size, 0);
    const before = writes;
    runner.setReducedMotion(false);
    assert.equal(writes, before);
    runner.setVisible(true);
    assert.equal(pending.size, 1);
    runner.setReducedMotion(true);
    assert.equal(pending.size, 0);
    runner.dispose();
    runner.setVisible(true);
    assert.equal(pending.size, 0);
    const stopped = writes;
    runner.dispose();
    assert.equal(writes, stopped);
  } finally {
    globalThis.setTimeout = originalSet;
    globalThis.clearTimeout = originalClear;
    if (originalDocument)
      Object.defineProperty(globalThis, "document", originalDocument);
    else Reflect.deleteProperty(globalThis, "document");
  }
});
