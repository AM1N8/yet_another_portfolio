import type { ITheme } from "@xterm/xterm";

export function readTerminalTheme(element: HTMLElement): ITheme {
  const style = getComputedStyle(element);
  // xterm accepts rgb/rgba, but not CSS color-mix() or color(srgb ...).
  const probe = document.createElement("canvas").getContext("2d");
  const token = (name: string) => {
    const value = style.getPropertyValue(name).trim();
    if (!probe || value.startsWith("#") || value.startsWith("rgba("))
      return value;
    probe.clearRect(0, 0, 1, 1);
    probe.fillStyle = value;
    probe.fillRect(0, 0, 1, 1);
    const [red, green, blue, alpha] = probe.getImageData(0, 0, 1, 1).data;
    return `rgba(${red},${green},${blue},${alpha / 255})`;
  };
  return {
    background: token("--terminal-bg"),
    foreground: token("--terminal-fg"),
    cursor: token("--terminal-cursor"),
    cursorAccent: token("--terminal-bg"),
    selectionBackground: token("--terminal-selection"),
    black: token("--ansi-black"),
    red: token("--ansi-red"),
    green: token("--ansi-green"),
    yellow: token("--ansi-yellow"),
    blue: token("--ansi-blue"),
    magenta: token("--ansi-magenta"),
    cyan: token("--ansi-cyan"),
    white: token("--ansi-white"),
    brightBlack: token("--terminal-muted"),
    brightRed: token("--ansi-red"),
    brightGreen: token("--ansi-green"),
    brightYellow: token("--ansi-yellow"),
    brightBlue: token("--ansi-blue"),
    brightMagenta: token("--ansi-magenta"),
    brightCyan: token("--ansi-cyan"),
    brightWhite: token("--ansi-white"),
  };
}
