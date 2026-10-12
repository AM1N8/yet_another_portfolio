"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Command } from "@/lib/shell";
import { setTheme, toggleTheme } from "@/lib/theme";

export function CommandPalette({
  commands,
  brand,
}: {
  commands: Command[];
  brand: string;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState("");
  const filtered = commands.filter((command) =>
    `${command.group} ${command.label}`
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );
  const available = filtered.filter((command) => command.available);
  const active =
    available.find((command) => command.id === selectedId) || available[0];
  const groups = Array.from(new Set(filtered.map((command) => command.group)));

  const open = useCallback(() => {
    const focused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    // Restore to the disclosure trigger if opening the modal hides its links.
    previousFocus.current =
      focused
        ?.closest("details[open]")
        ?.querySelector<HTMLElement>("summary") || focused;
    setQuery("");
    setSelectedId("");
    setStatus("");
    document
      .querySelectorAll<HTMLDetailsElement>("details[open]")
      .forEach((details) => {
        details.open = false;
      });
    dialog.current?.showModal();
    search.current?.focus();
  }, []);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.isComposing &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        if (dialog.current?.open) dialog.current.close();
        else open();
      }
    };
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, [open]);

  useEffect(() => {
    if (active && dialog.current?.open)
      document
        .getElementById(`${id}-${active.id}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [active, id]);

  const execute = async (command: Command) => {
    if (!command.available) return;
    if (command.kind === "copy-email") {
      try {
        await navigator.clipboard.writeText(command.email);
        setStatus("Email copied to clipboard.");
      } catch {
        setStatus(`Clipboard unavailable. Copy this address: ${command.email}`);
      }
      return;
    }
    if (command.kind === "theme") toggleTheme();
    else if (command.kind === "system-theme") setTheme("system");
    dialog.current?.close();
    if (command.kind === "terminal") {
      // Transfer focus after the palette's close event has restored its launcher.
      requestAnimationFrame(() =>
        window.dispatchEvent(
          new CustomEvent("portfolio-open-terminal", {
            detail: { returnFocus: previousFocus.current },
          }),
        ),
      );
    }
    if (command.kind === "link") window.location.assign(command.href);
  };

  return (
    <>
      <button
        className="tool-button label"
        type="button"
        aria-label="Open command palette"
        aria-haspopup="dialog"
        aria-controls={`${id}-dialog`}
        aria-keyshortcuts="Control+k Meta+k"
        onClick={open}
      >
        <span className="command-trigger-label">COMMANDS</span>
        <kbd className="command-shortcut">⌘ K</kbd>
      </button>
      <dialog
        ref={dialog}
        id={`${id}-dialog`}
        className="command-dialog"
        aria-labelledby={`${id}-title`}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const focusable = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              "button:not([disabled]), input, a[href], [tabindex]",
            ),
          ).filter(
            (element) =>
              element.tabIndex >= 0 && element.getClientRects().length > 0,
          );
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onClose={() => {
          if (previousFocus.current?.isConnected) previousFocus.current.focus();
        }}
        onPointerDown={(event) => {
          if (event.target !== dialog.current) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            dialog.current?.close();
        }}
      >
        <div className="command-dialog-header">
          <h2 id={`${id}-title`} className="command-dialog-title label">
            {brand} / COMMANDS
          </h2>
          <button
            className="tool-button label"
            type="button"
            aria-label="Close command palette"
            onClick={() => dialog.current?.close()}
          >
            ESC
          </button>
        </div>
        <div className="command-search">
          <label className="sr-only" htmlFor={`${id}-search`}>
            Search commands
          </label>
          <input
            ref={search}
            id={`${id}-search`}
            type="text"
            placeholder="Search commands…"
            autoComplete="off"
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
            aria-controls={`${id}-results`}
            aria-activedescendant={active ? `${id}-${active.id}` : undefined}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedId("");
            }}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return;
              const index = available.findIndex(
                (command) => command.id === active?.id,
              );
              if (
                (event.key === "ArrowDown" || event.key === "ArrowUp") &&
                available.length
              ) {
                event.preventDefault();
                const step = event.key === "ArrowDown" ? 1 : -1;
                setSelectedId(
                  available[
                    (index + step + available.length) % available.length
                  ].id,
                );
              } else if (event.key === "Enter" && active) {
                event.preventDefault();
                void execute(active);
              }
            }}
          />
        </div>
        <div
          id={`${id}-results`}
          className="command-results"
          role="listbox"
          tabIndex={-1}
          aria-label="Commands"
        >
          {groups.map((group) => (
            <div key={group} role="group" aria-label={group}>
              <p className="command-group label" aria-hidden="true">
                {group}
              </p>
              {filtered
                .filter((command) => command.group === group)
                .map((command) => (
                  <button
                    key={command.id}
                    id={`${id}-${command.id}`}
                    className="command-item"
                    type="button"
                    role="option"
                    tabIndex={-1}
                    aria-selected={active?.id === command.id}
                    aria-disabled={!command.available}
                    disabled={!command.available}
                    onMouseMove={() => {
                      if (command.available) setSelectedId(command.id);
                    }}
                    onClick={() => {
                      void execute(command);
                    }}
                  >
                    <span>{command.label}</span>
                    <span className="command-item-detail mono">
                      {command.available
                        ? command.kind === "link"
                          ? "OPEN ↗"
                          : "RUN ↵"
                        : "NOT BUILT YET"}
                    </span>
                  </button>
                ))}
            </div>
          ))}
          {!filtered.length && (
            <p className="command-empty">No matching commands.</p>
          )}
        </div>
        <div className="command-dialog-footer label">
          <span>↑ ↓ SELECT</span>
          <span>↵ RUN</span>
          <span>ESC CLOSE</span>
          <span role="status">{status}</span>
        </div>
      </dialog>
    </>
  );
}
