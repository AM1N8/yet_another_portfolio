import test from "node:test";
import assert from "node:assert/strict";
import { THEMES, THEME_NAMES } from "../lib/themes/registry.ts";
import {
  initializeTheme,
  getTheme,
  setTheme,
  subscribeTheme,
} from "../lib/theme.ts";
import { createTerminalContent } from "../components/terminal/content.ts";
import {
  executeCommand,
  type CommandContext,
} from "../components/terminal/commands.ts";
import { VirtualFilesystem } from "../components/terminal/filesystem.ts";
import { loadPortfolio } from "../lib/content/loadPortfolio.ts";

test("terminal resolves every theme and alias, lists hidden palettes, and rejects invalid input", () => {
  const content = createTerminalContent(loadPortfolio());
  const context: CommandContext = {
    content,
    fs: new VirtualFilesystem(content),
    cwd: content.home,
    history: [],
    theme: "tokyonight",
    columns: 90,
  };
  for (const theme of THEMES) {
    for (const name of [theme.name, ...theme.aliases]) {
      const result = executeCommand(`theme ${name}`, context);
      assert.deepEqual(result.action, { kind: "theme", theme: theme.name });
      assert.match(result.output, new RegExp(`theme: ${theme.name}`));
    }
  }
  assert.equal(executeCommand("theme", context).output, "theme: tokyonight");
  assert.equal(
    executeCommand("theme current", context).output,
    "theme: tokyonight",
  );
  const list = executeCommand("theme list", context).output;
  assert.ok(list.startsWith(`${content.brand} THEMES`));
  for (const theme of THEMES) assert.ok(list.includes(theme.label));
  for (const input of ["theme invalid", "theme constructor", "theme ink paper"])
    assert.equal(executeCommand(input, context).action, undefined);
});

test("serialized pre-paint initializer restores all preferences and rejects invalid storage", () => {
  const originals = new Map<string, PropertyDescriptor | undefined>();
  const root = { dataset: {} as Record<string, string> };
  let saved: string | null = null;
  for (const [name, value] of Object.entries({
    document: { documentElement: root },
    localStorage: { getItem: () => saved },
    matchMedia: () => ({ matches: true }),
  })) {
    originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, value });
  }
  try {
    // The initializer is also embedded verbatim in the server-rendered head.
    const run = new Function(
      `return (${initializeTheme.toString()})`,
    )() as typeof initializeTheme;
    for (const theme of THEME_NAMES) {
      saved = theme;
      run("system", THEME_NAMES);
      assert.equal(root.dataset.theme, theme);
    }
    saved = "invalid";
    run("system", THEME_NAMES);
    assert.equal(root.dataset.theme, "ink");
    saved = "system";
    run("paper", THEME_NAMES);
    assert.equal(root.dataset.themePreference, "system");
  } finally {
    for (const [name, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  }
});

test("one shared theme connection synchronizes consumers and releases all event listeners", () => {
  const originals = new Map<string, PropertyDescriptor | undefined>();
  const root = {
    dataset: {
      theme: "paper",
      themePreference: "paper",
      defaultTheme: "system",
    },
  };
  const windowTarget = new EventTarget(),
    media = new EventTarget();
  let connections = 0,
    disconnections = 0,
    stored = "";
  const add = windowTarget.addEventListener.bind(windowTarget),
    remove = windowTarget.removeEventListener.bind(windowTarget);
  windowTarget.addEventListener = (...args) => {
    connections++;
    add(...args);
  };
  windowTarget.removeEventListener = (...args) => {
    disconnections++;
    remove(...args);
  };
  for (const [name, value] of Object.entries({
    document: { documentElement: root },
    window: windowTarget,
    localStorage: {
      setItem: (_key: string, value: string) => {
        stored = value;
      },
    },
    matchMedia: () => Object.assign(media, { matches: true }),
  })) {
    originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, value });
  }
  try {
    let first = 0,
      second = 0;
    const stopFirst = subscribeTheme(() => first++),
      stopSecond = subscribeTheme(() => second++);
    assert.equal(connections, 2);
    for (const theme of THEME_NAMES) {
      setTheme(theme);
      assert.equal(getTheme(), theme);
      assert.equal(stored, theme);
    }
    assert.equal(first, 6);
    assert.equal(second, 6);
    stopFirst();
    setTheme("ink");
    assert.equal(first, 6);
    assert.equal(second, 7);
    stopSecond();
    assert.equal(disconnections, 2);
  } finally {
    for (const [name, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  }
});
