"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  MODES,
  filterNodes,
  visibleNodes,
  nodeDescription,
  projectForNode,
  type ActivityMode,
  type ActivityModel,
} from "@/lib/activity/model";
import { calculateLayout } from "@/lib/activity/layout";
import { createRenderer, type ActivityRenderer } from "@/lib/activity/renderer";
import type { GraphNode } from "@/lib/github/types";
import { ProjectPeriods } from "./ProjectPeriods";

export function ActivityUniverse({
  model,
  children,
}: {
  model: ActivityModel;
  children: ReactNode;
}) {
  const { data, config, projects } = model;
  const modes = MODES.filter((mode) => config.views[mode]);
  const [mode, setMode] = useState<ActivityMode>(
    modes.includes(config.default_view)
      ? config.default_view
      : (modes[0] ?? "activity"),
  );
  const [year, setYear] = useState(
    config.appearance.show_year_selector
      ? (data.years[0]?.toString() ?? "all")
      : "all",
  );
  const [width, setWidth] = useState(0);
  const [hovered, setHovered] = useState<GraphNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<ActivityRenderer | null>(null);
  const unavailableRef = useRef<HTMLParagraphElement>(null);
  const router = useRouter();
  const filtered = useMemo(
    () => filterNodes(data.nodes, year),
    [data.nodes, year],
  );
  const drawn = useMemo(
    () => visibleNodes(filtered, width, config),
    [filtered, width, config],
  );
  const layout = useMemo(
    () => calculateLayout(drawn, mode, width || 640, projects),
    [drawn, mode, width, projects],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const renderer = createRenderer(canvas, {
      reducedMotion: motion.matches || !config.motion,
      morph: config.interaction.project_cluster_morph,
      shape: config.appearance.node_shape,
      onHover: setHovered,
    });
    rendererRef.current = renderer;
    if (unavailableRef.current)
      unavailableRef.current.hidden = Boolean(renderer);
    const resize = () => {
      setWidth(Math.round(stage.getBoundingClientRect().width));
    };
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    resize();
    const reducedChanged = () =>
      renderer?.setReducedMotion(motion.matches || !config.motion);
    const themeObserver = new MutationObserver(() => renderer?.refreshTheme());
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    motion.addEventListener("change", reducedChanged);
    // A DPR change need not change CSS width (e.g. moving between displays).
    let dprQuery: MediaQueryList;
    const watchDpr = () => {
      dprQuery?.removeEventListener("change", dprChanged);
      dprQuery = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      dprQuery.addEventListener("change", dprChanged);
    };
    const dprChanged = () => {
      window.dispatchEvent(new Event("activity-dpr-change"));
      watchDpr();
    };
    watchDpr();
    return () => {
      observer.disconnect();
      themeObserver.disconnect();
      motion.removeEventListener("change", reducedChanged);
      dprQuery.removeEventListener("change", dprChanged);
      renderer?.dispose();
      rendererRef.current = null;
    };
  }, [config]);

  useEffect(() => {
    if (!width) return;
    const update = () => rendererRef.current?.update(layout, width);
    update();
    window.addEventListener("activity-dpr-change", update);
    return () => window.removeEventListener("activity-dpr-change", update);
  }, [layout, width]);

  const selected =
    hovered && drawn.some((node) => node.id === hovered.id) ? hovered : null;
  function chooseMode(next: ActivityMode) {
    setHovered(null);
    rendererRef.current?.hover(null);
    setMode(next);
  }
  const associated = selected
    ? projects.filter((project) => selected.projectSlugs.includes(project.slug))
    : [];
  return (
    <div
      className="activity-universe"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          rendererRef.current?.hover(null);
          setHovered(null);
        }
      }}
    >
      <div className="activity-toolbar">
        <div className="activity-modes" role="group" aria-label="Activity view">
          {modes.map((view) => (
            <button
              key={view}
              type="button"
              className="label"
              aria-pressed={mode === view}
              aria-controls="activity-plot"
              onClick={() => chooseMode(view)}
            >
              {view.toUpperCase()}
            </button>
          ))}
        </div>
        {config.appearance.show_year_selector && data.years.length > 1 && (
          <label className="label activity-year">
            Year
            <select
              value={year}
              onChange={(event) => {
                setHovered(null);
                setYear(event.target.value);
              }}
            >
              <option value="all">All years</option>
              {data.years.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <p className="activity-status mono text-muted" role="status">
        {mode.toUpperCase()} / {drawn.length} of {filtered.length} records shown
        {data.source === "fallback"
          ? " · saved fallback"
          : data.source === "github"
            ? " · GitHub snapshot"
            : " · data unavailable"}
      </p>
      <p className="activity-explanation text-muted">
        {mode === "languages"
          ? "Grouped by the repository’s primary language. Unknown languages stay unassigned; byte shares are available in the text view."
          : mode === "projects"
            ? "Activity grouped by associated project. Calendar totals without a repository remain unattributed."
            : mode === "timeline"
              ? "Records run from earlier to later dates. Project periods below preserve the precision supplied in the portfolio."
              : "Filled cells show contribution counts; outlined cells show public events. These are separate measures, not a combined total."}
      </p>
      <noscript>
        <p className="activity-explanation">
          Interactive views require JavaScript. The complete text view below
          remains available.
        </p>
      </noscript>
      <div
        id="activity-plot"
        ref={stageRef}
        className="activity-stage"
        style={{ height: layout.height }}
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          onPointerMove={(event) => {
            if (
              !config.appearance.show_tooltips ||
              !config.interaction.hover_details
            )
              return;
            const box = event.currentTarget.getBoundingClientRect();
            const node = rendererRef.current?.hitTest(
              event.clientX - box.left,
              event.clientY - box.top,
            );
            if (node) rendererRef.current?.hover(node);
          }}
          onClick={(event) => {
            if (!config.interaction.click_opens_project) return;
            const box = event.currentTarget.getBoundingClientRect();
            const node = rendererRef.current?.hitTest(
              event.clientX - box.left,
              event.clientY - box.top,
            );
            const project = node && projectForNode(node, projects);
            if (project) router.push(`/work/${project.slug}`);
          }}
        />
        {config.appearance.show_labels && width > 0 && (
          <div className="activity-labels">
            {layout.labels.map((label) => (
              <div
                key={label.id}
                className="activity-label mono"
                style={{ left: label.x, top: label.y, width: label.width }}
              >
                {label.href && config.interaction.click_opens_project ? (
                  <a href={label.href}>{label.text} ↗</a>
                ) : (
                  <span>{label.text}</span>
                )}
              </div>
            ))}
          </div>
        )}
        {filtered.length === 0 && (
          <div className="activity-empty">
            <p>No activity records available.</p>
            <p className="text-muted">
              Project information remains available in the text view below. No
              activity has been estimated.
            </p>
          </div>
        )}
      </div>
      <p ref={unavailableRef} hidden className="activity-explanation">
        Canvas is unavailable. All records and project links are available in
        the text view.
      </p>
      <div className="activity-inspector" aria-label="Node details">
        {selected ? (
          <>
            <p role="tooltip">{nodeDescription(selected, data)}</p>
            {associated.map((project) => (
              <a key={project.slug} href={`/work/${project.slug}`}>
                {project.title} ↗{" "}
                <span className="text-muted">
                  {project.domains.join(" / ")}
                </span>
              </a>
            ))}
          </>
        ) : (
          <p className="text-muted">
            Hover a node for details. Use the text view for keyboard and touch
            access to every record and project link.
          </p>
        )}
      </div>
      {mode === "timeline" && <ProjectPeriods model={model} year={year} />}
      {children}
    </div>
  );
}
