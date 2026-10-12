"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";

export type TerminalPanelProps = { brand: string; onClose: () => void };
export const TERMINAL_EVENT = "portfolio-open-terminal";

export function TerminalLauncher({ brand }: { brand: string }) {
  const [Panel, setPanel] = useState<ComponentType<TerminalPanelProps> | null>(
    null,
  );
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const previousFocus = useRef<HTMLElement | null>(null);
  const requested = useRef(false);
  const mounted = useRef(true);
  const close = useCallback(() => {
    requested.current = false;
    setVisible(false);
    requestAnimationFrame(() => {
      if (previousFocus.current?.isConnected) previousFocus.current.focus();
    });
  }, []);
  const open = useCallback(async (returnFocus?: HTMLElement) => {
    if (requested.current) return;
    requested.current = true;
    const focused =
      returnFocus ||
      (document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null);
    previousFocus.current =
      focused
        ?.closest("details[open]")
        ?.querySelector<HTMLElement>("summary") || focused;
    const existingDialog = focused?.closest<HTMLDialogElement>("dialog[open]");
    if (existingDialog) {
      previousFocus.current =
        Array.from(
          document.querySelectorAll<HTMLButtonElement>("button[aria-controls]"),
        ).find(
          (button) =>
            button.getAttribute("aria-controls") === existingDialog.id,
        ) || previousFocus.current;
      existingDialog.close();
    }
    document
      .querySelectorAll<HTMLDetailsElement>("details[open]")
      .forEach((details) => {
        details.open = false;
      });
    setError("");
    try {
      const terminalModule = await import("./PortfolioTerminal");
      if (!mounted.current || !requested.current) return;
      setPanel(() => terminalModule.PortfolioTerminal);
      setVisible(true);
    } catch {
      requested.current = false;
      if (mounted.current) setError("Terminal unavailable. Please try again.");
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    const shortcut = (event: KeyboardEvent) => {
      if (
        event.ctrlKey &&
        !event.altKey &&
        !event.metaKey &&
        !event.isComposing &&
        (event.code === "Backquote" || event.key === "`" || event.key === "~")
      ) {
        event.preventDefault();
        if (requested.current) close();
        else void open();
      }
    };
    const launch = (event: Event) => {
      const focus = (event as CustomEvent<{ returnFocus?: HTMLElement }>).detail
        ?.returnFocus;
      void open(focus);
    };
    document.addEventListener("keydown", shortcut);
    window.addEventListener(TERMINAL_EVENT, launch);
    return () => {
      mounted.current = false;
      requested.current = false;
      document.removeEventListener("keydown", shortcut);
      window.removeEventListener(TERMINAL_EVENT, launch);
    };
  }, [open, close]);
  return (
    <>
      <button
        type="button"
        className="tool-button label terminal-launcher"
        aria-label="Open portfolio terminal"
        aria-haspopup="dialog"
        aria-keyshortcuts="Control+`"
        onClick={() => void open()}
      >
        [ &gt;_ ]
      </button>
      {error && (
        <span role="status" className="sr-only">
          {error}
        </span>
      )}
      {visible && Panel && <Panel brand={brand} onClose={close} />}
    </>
  );
}
