"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { getTheme, setTheme, subscribeTheme } from "@/lib/theme";
import { readTerminalTheme } from "@/lib/themes/terminal";
import type { TerminalContent } from "./content";
import type { TerminalPanelProps } from "./TerminalLauncher";
import { TerminalShell } from "./TerminalShell";
import { startCmatrix } from "./Cmatrix";
import "@xterm/xterm/css/xterm.css";
import "./terminal.css";

export function PortfolioTerminal({ brand, onClose }: TerminalPanelProps) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const xterm = useRef<Terminal | null>(null);
  const program = useRef<ReturnType<typeof startCmatrix> | null>(null);
  const stopProgram = useRef<(() => void) | null>(null);
  const router = useRouter();
  const [status, setStatus] = useState("Loading portfolio shell…");
  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    const modal = dialog.current;
    const element = host.current;
    if (!modal || !element) return;
    modal.showModal();
    const abort = new AbortController();
    let disposed = false;
    let cleanup = () => {};
    const initialize = async () => {
      try {
        const response = await fetch("/api/terminal", { signal: abort.signal });
        if (!response.ok) throw new Error("Content unavailable");
        const content: TerminalContent = await response.json();
        await document.fonts.ready;
        if (disposed) return;
        const terminal = new Terminal({
          fontFamily:
            getComputedStyle(document.body)
              .getPropertyValue("--font-geist-mono")
              .trim() || "monospace",
          fontSize: innerWidth < 768 ? 13 : 14,
          lineHeight: 1.25,
          cursorBlink: false,
          cursorStyle: "bar",
          scrollback: 1000,
          screenReaderMode: true,
          allowProposedApi: false,
          theme: readTerminalTheme(element),
        });
        const fit = new FitAddon();
        terminal.loadAddon(fit);
        terminal.open(element);
        fit.fit();
        xterm.current = terminal;
        const motion = matchMedia("(prefers-reduced-motion: reduce)");
        const stop = () => {
          program.current?.dispose();
          program.current = null;
          setInteractive(false);
          shell.finishProgram();
        };
        stopProgram.current = stop;
        const navigate = (href: string) => {
          if (href.startsWith("/") && !href.startsWith("//")) {
            onClose();
            router.push(href);
          } else {
            const url = new URL(href);
            if (["https:", "http:"].includes(url.protocol)) {
              window.open(href, "_blank", "noopener,noreferrer");
            }
          }
        };
        const shell = new TerminalShell(
          terminal,
          content,
          (action) => {
            if (action.kind === "clear") terminal.clear();
            else if (action.kind === "exit") onClose();
            else if (action.kind === "theme") setTheme(action.theme);
            else if (action.kind === "open") navigate(action.href);
            else if (action.kind === "cmatrix") {
              program.current = startCmatrix(terminal, motion.matches);
              setInteractive(true);
            }
          },
          getTheme,
        );
        const keys = terminal.onData((data) => {
          if (program.current) {
            if (data === "\x03") stop();
            return;
          }
          shell.accept(data);
        });
        const links = terminal.registerLinkProvider({
          provideLinks(lineNumber, callback) {
            const line =
              terminal.buffer.active
                .getLine(lineNumber - 1)
                ?.translateToString() || "";
            callback(
              [...line.matchAll(/\/work\/([\w-]+)/g)].flatMap((match) =>
                content.projects.some((project) => project.slug === match[1])
                  ? [
                      {
                        range: {
                          start: { x: match.index! + 1, y: lineNumber },
                          end: {
                            x: match.index! + match[0].length,
                            y: lineNumber,
                          },
                        },
                        text: match[0],
                        activate: () => navigate(match[0]),
                      },
                    ]
                  : [],
              ),
            );
          },
        });
        terminal.attachCustomKeyEventHandler((event) => {
          if (
            event.key === "Tab" ||
            event.key === "Escape" ||
            (event.ctrlKey && event.code === "Backquote")
          )
            return false;
          return true;
        });
        let timer: ReturnType<typeof setTimeout>;
        const resize = new ResizeObserver(() => {
          clearTimeout(timer);
          timer = setTimeout(() => {
            if (!disposed && !document.hidden) {
              fit.fit();
              shell.redraw();
            }
          }, 80);
        });
        resize.observe(element);
        const visibility = () => {
          program.current?.setVisible(!document.hidden);
          if (!document.hidden) {
            fit.fit();
            shell.redraw();
          }
        };
        const reduced = () => program.current?.setReducedMotion(motion.matches);
        document.addEventListener("visibilitychange", visibility);
        motion.addEventListener("change", reduced);
        const unsubscribeTheme = subscribeTheme(() => {
          terminal.options.theme = readTerminalTheme(element);
        });
        cleanup = () => {
          unsubscribeTheme();
          clearTimeout(timer);
          resize.disconnect();
          document.removeEventListener("visibilitychange", visibility);
          motion.removeEventListener("change", reduced);
          program.current?.dispose();
          program.current = null;
          keys.dispose();
          links.dispose();
          terminal.dispose();
          xterm.current = null;
          stopProgram.current = null;
        };
        shell.start();
        terminal.focus();
        setStatus("Ready");
        // Tab completes within the shell; Shift+Tab reaches the visible close control.
        const tab = (event: KeyboardEvent) => {
          if (
            event.key === "Tab" &&
            !event.shiftKey &&
            event.target instanceof HTMLElement &&
            element.contains(event.target)
          ) {
            event.preventDefault();
            if (!program.current) shell.complete();
          }
        };
        modal.addEventListener("keydown", tab);
        const terminalCleanup = cleanup;
        cleanup = () => {
          modal.removeEventListener("keydown", tab);
          terminalCleanup();
        };
      } catch {
        if (!disposed)
          setStatus("Shell could not load. Close and reopen to try again.");
      }
    };
    void initialize();
    return () => {
      disposed = true;
      abort.abort();
      cleanup();
      if (modal.open) modal.close();
    };
  }, [onClose, router]);

  return (
    <dialog
      ref={dialog}
      className="portfolio-terminal"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onPointerDown={(event) => {
        if (event.target !== dialog.current) return;
        if (program.current) {
          event.preventDefault();
          xterm.current?.focus();
          return;
        }
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onClose();
      }}
      onKeyDown={(event) => {
        if (
          program.current &&
          event.ctrlKey &&
          event.key.toLowerCase() === "c"
        ) {
          event.preventDefault();
          stopProgram.current?.();
          return;
        }
        if (event.key !== "Tab") return;
        const close =
          event.currentTarget.querySelector<HTMLButtonElement>("button");
        if (event.target === close && event.shiftKey) {
          event.preventDefault();
          xterm.current?.focus();
        } else if (event.target === close) {
          event.preventDefault();
          xterm.current?.focus();
        }
      }}
    >
      <header className="terminal-header">
        <h2 id={`${id}-title`} className="label">
          {brand} / TERMINAL
        </h2>
        <div className="terminal-header-tools">
          <kbd className="label">CTRL+~</kbd>
          <button
            type="button"
            className="label"
            aria-label="Close portfolio terminal"
            onClick={onClose}
          >
            ESC <span aria-hidden="true">×</span>
          </button>
        </div>
      </header>
      <p id={`${id}-description`} className="sr-only">
        Browser-side portfolio shell. Type help for commands. Tab completes
        input; Shift+Tab reaches Close. Escape closes. Ctrl+C stops interactive
        programs.
      </p>
      <div
        ref={host}
        className="terminal-screen"
        aria-label="Portfolio terminal input and output"
      />
      <footer className="terminal-status label">
        <span role="status">
          {interactive ? "CMATRIX / CTRL+C TO STOP" : status}
        </span>
        <span>PORTFOLIO-SH / READ ONLY</span>
      </footer>
    </dialog>
  );
}
