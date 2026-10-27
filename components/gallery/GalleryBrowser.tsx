"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  GALLERY_TYPES,
  filterGallery,
  galleryUrl,
  readGalleryState,
  type ArchiveItem,
  type GalleryState,
} from "@/lib/gallery";

const ArtifactViewer = dynamic(() => import("./ArtifactViewer"), {
  ssr: false,
});

export function GalleryBrowser({
  items,
  initial,
  brand,
  children,
}: {
  items: ArchiveItem[];
  initial: GalleryState;
  brand: string;
  children: ReactNode;
}) {
  const [state, setState] = useState(initial);
  const host = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const shown = useMemo(() => filterGallery(items, state), [items, state]);
  const selected = items.find((item) => item.id === state.item);
  const change = useCallback((next: GalleryState, push = false) => {
    setState(next);
    window.history[push ? "pushState" : "replaceState"](
      null,
      "",
      galleryUrl(next),
    );
  }, []);
  const restore = useCallback(
    () =>
      requestAnimationFrame(() => {
        const target = previousFocus.current;
        if (target?.isConnected && !target.closest("[hidden]"))
          target.focus({ preventScroll: true });
        else
          document
            .getElementById("archive-results")
            ?.focus({ preventScroll: true });
      }),
    [],
  );
  useEffect(() => {
    const back = () => {
      setState(readGalleryState(new URLSearchParams(location.search)));
      restore();
    };
    window.addEventListener("popstate", back);
    return () => window.removeEventListener("popstate", back);
  }, [restore]);
  useEffect(() => {
    const ids = new Set(shown.map((item) => item.id));
    host.current
      ?.querySelectorAll<HTMLElement>("[data-artifact]")
      .forEach((element) => {
        element.hidden = !ids.has(element.dataset.artifact!);
      });
    host.current
      ?.querySelectorAll<HTMLAnchorElement>("a[data-gallery-open]")
      .forEach((link) => {
        link.href = galleryUrl({ ...state, item: link.dataset.galleryOpen! });
      });
  }, [state, shown]);
  const update = (key: keyof GalleryState, value: string) =>
    change({ ...state, [key]: value, item: "" });
  const active = (["type", "project", "year", "q"] as const).filter(
    (key) => state[key],
  );
  return (
    <div
      ref={host}
      className="archive-browser"
      data-view={state.view}
      onClick={(event) => {
        const link = (event.target as HTMLElement).closest<HTMLAnchorElement>(
          "a[data-gallery-open]",
        );
        if (
          !link ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        event.preventDefault();
        previousFocus.current = link;
        change({ ...state, item: link.dataset.galleryOpen! }, true);
      }}
    >
      <form
        className="archive-filters"
        action="/gallery"
        role="search"
        aria-label="Filter gallery"
        onSubmit={(event) => event.preventDefault()}
      >
        <input type="hidden" name="view" value={state.view} />
        <label>
          <span className="label">TYPE</span>
          <select
            name="type"
            aria-label="TYPE"
            value={state.type}
            onChange={(event) => update("type", event.target.value)}
          >
            <option value="">All types</option>
            {GALLERY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">PROJECT</span>
          <select
            name="project"
            aria-label="PROJECT"
            value={state.project}
            onChange={(event) => update("project", event.target.value)}
          >
            <option value="">All projects</option>
            {Array.from(
              new Map(
                items
                  .filter((item) => item.project_slug)
                  .map((item) => [item.project_slug!, item.projectTitle!]),
              ),
            ).map(([slug, title]) => (
              <option key={slug} value={slug}>
                {title}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">YEAR</span>
          <select
            name="year"
            aria-label="YEAR"
            value={state.year}
            onChange={(event) => update("year", event.target.value)}
          >
            <option value="">All years</option>
            {Array.from(
              new Set(
                items.flatMap((item) =>
                  item.date ? [item.date.slice(0, 4)] : [],
                ),
              ),
            )
              .sort()
              .reverse()
              .map((year) => (
                <option key={year}>{year}</option>
              ))}
          </select>
        </label>
        <label className="archive-search">
          <span className="label">SEARCH / TAGS</span>
          <input
            type="search"
            name="q"
            maxLength={200}
            value={state.q}
            placeholder="Title, project, tag or caption"
            onChange={(event) => update("q", event.target.value)}
          />
        </label>
        <noscript>
          <button type="submit">Apply filters</button>
        </noscript>
      </form>
      <div className="archive-status">
        <p
          id="archive-results"
          tabIndex={-1}
          role="status"
          aria-live="polite"
          className="label"
        >
          {shown.length} / {items.length} ARTIFACTS
        </p>
        <div className="archive-views" role="group" aria-label="Archive view">
          {(["grid", "index"] as const).map((view) => (
            <button
              key={view}
              type="button"
              aria-pressed={state.view === view}
              onClick={() => update("view", view)}
            >
              {view.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {active.length > 0 && (
        <div className="archive-active" aria-label="Active filters">
          {active.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => update(key, "")}
              aria-label={`Remove ${key} filter`}
            >
              {key}: {state[key]} ×
            </button>
          ))}
          <a
            href={galleryUrl({
              ...initial,
              type: "",
              project: "",
              year: "",
              q: "",
              item: "",
              view: state.view,
            })}
            onClick={(event) => {
              event.preventDefault();
              change({
                ...state,
                type: "",
                project: "",
                year: "",
                q: "",
                item: "",
              });
            }}
          >
            Clear filters ↗
          </a>
        </div>
      )}
      {shown.length === 0 && (
        <div className="archive-empty">
          <h2>No matching artifacts.</h2>
          <p>Try a different project, type, year or search term.</p>
        </div>
      )}
      {children}
      {selected && (
        <ArtifactViewer
          item={selected}
          sequence={
            shown.some((item) => item.id === selected.id) ? shown : items
          }
          brand={brand}
          onClose={() => {
            change({ ...state, item: "" });
            restore();
          }}
          onNavigate={(item) => change({ ...state, item })}
        />
      )}
    </div>
  );
}
