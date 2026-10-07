import { extent, group } from "d3-array";
import { scaleBand, scaleUtc } from "d3-scale";
import { utcSunday, utcWeek } from "d3-time";
import type { GraphNode } from "../github/types.ts";
import {
  projectForNode,
  type ActivityMode,
  type ActivityProject,
} from "./model.ts";

export interface TargetNode {
  node: GraphNode;
  x: number;
  y: number;
  radius: number;
}
export interface LayoutLabel {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  href?: string;
}
export interface ActivityLayout {
  nodes: TargetNode[];
  labels: LayoutLabel[];
  height: number;
}
const MARGIN = 16;

function projectGroup(node: GraphNode, projects: ActivityProject[]) {
  const project = projectForNode(node, projects);
  return (
    project?.slug ?? (node.kind === "contribution" ? "unattributed" : "other")
  );
}

export function calculateLayout(
  nodes: GraphNode[],
  mode: ActivityMode,
  width: number,
  projects: ActivityProject[],
): ActivityLayout {
  width = Math.max(240, width);
  if (!nodes.length) return { nodes: [], labels: [], height: 280 };
  if (mode === "activity") return calendarLayout(nodes, width);
  const key =
    mode === "languages"
      ? (node: GraphNode) => node.language ?? "Language unavailable"
      : (node: GraphNode) => projectGroup(node, projects);
  const groups = [...group(nodes, key)].sort(([a], [b]) => a.localeCompare(b));
  const labels: LayoutLabel[] = [];
  const targets: TargetNode[] = [];
  const labelFor = (id: string) =>
    projects.find((project) => project.slug === id)?.title ??
    (id === "unattributed"
      ? "Unattributed contributions"
      : id === "other"
        ? "Other repositories"
        : id);

  if (mode === "timeline") {
    const dates = extent(
      nodes,
      (node) => new Date(`${node.date}T00:00:00Z`),
    ) as [Date, Date];
    const x = scaleUtc()
      .domain(dates)
      .range([MARGIN + 8, width - MARGIN - 8]);
    groups.forEach(([id, entries], row) => {
      const top = row * 104 + 16;
      labels.push({
        id,
        text: labelFor(id),
        x: MARGIN,
        y: top,
        width: width - MARGIN * 2,
        href: projects.some((p) => p.slug === id) ? `/work/${id}` : undefined,
      });
      const days = group(entries, (node) => node.date);
      for (const sameDay of days.values())
        sameDay.forEach((node, index) =>
          targets.push({
            node,
            x: x(new Date(`${node.date}T00:00:00Z`)),
            y: top + 50 + (index % 5) * 7,
            radius: 3,
          }),
        );
    });
    const height = groups.length * 104 + 64;
    const ticks =
      dates[0].getTime() === dates[1].getTime()
        ? [dates[0]]
        : x.ticks(width < 600 ? 3 : 6);
    let previousTickX = -Infinity;
    ticks.forEach((date) => {
      const left = Math.max(MARGIN, Math.min(width - 100, x(date) - 40));
      if (left < previousTickX + 100) return;
      previousTickX = left;
      labels.push({
        id: `tick:${date.toISOString()}`,
        text: date.toISOString().slice(0, 10),
        x: left,
        y: height - 40,
        width: 90,
      });
    });
    return { nodes: targets, labels, height };
  }

  const columns = width < 600 ? 1 : width < 1000 ? 2 : 3;
  const column = scaleBand<number>()
    .domain(Array.from({ length: columns }, (_, i) => i))
    .range([MARGIN, width - MARGIN])
    .paddingInner(0.12);
  const clusterHeight = 220;
  groups.forEach(([id, entries], index) => {
    const left = column(index % columns)!;
    const top = Math.floor(index / columns) * clusterHeight + 16;
    const clusterWidth = column.bandwidth();
    labels.push({
      id,
      text: `${labelFor(id)} · ${entries.length}`,
      x: left,
      y: top,
      width: clusterWidth,
      href:
        mode === "projects" && projects.some((p) => p.slug === id)
          ? `/work/${id}`
          : undefined,
    });
    const across = Math.max(
      1,
      Math.ceil(Math.sqrt((entries.length * clusterWidth) / 140)),
    );
    const rows = Math.ceil(entries.length / across);
    const step = Math.min(16, (clusterWidth - 16) / across, 136 / rows);
    entries.forEach((node, i) =>
      targets.push({
        node,
        x: left + clusterWidth / 2 + ((i % across) - (across - 1) / 2) * step,
        y: top + 64 + Math.floor(i / across) * step,
        radius: Math.max(1, Math.min(4, step * 0.32)),
      }),
    );
  });
  return {
    nodes: targets,
    labels,
    height: Math.max(
      280,
      Math.ceil(groups.length / columns) * clusterHeight + 16,
    ),
  };
}

function calendarLayout(nodes: GraphNode[], width: number): ActivityLayout {
  const targets: TargetNode[] = [];
  const labels: LayoutLabel[] = [];
  const weeksPerRow = width < 600 ? 13 : width < 1000 ? 26 : 53;
  const cell = Math.min(20, (width - MARGIN * 2) / weeksPerRow);
  let top = 16;
  // Calendar counts and public events occupy separate bands: they are not additive.
  for (const [band, entries] of [
    ...group(nodes, (node) => `${node.date.slice(0, 4)} / ${node.unit}`),
  ].sort(([a], [b]) => a.localeCompare(b))) {
    const year = Number(entries[0].date.slice(0, 4));
    const start = utcSunday.floor(new Date(Date.UTC(year, 0, 1)));
    const weekIndexes = entries.map((node) =>
      utcWeek.count(start, new Date(`${node.date}T00:00:00Z`)),
    );
    const firstRow = Math.floor(Math.min(...weekIndexes) / weeksPerRow);
    const lastRow = Math.floor(Math.max(...weekIndexes) / weeksPerRow);
    for (let row = firstRow; row <= lastRow; row++) {
      const rowTop = top + (row - firstRow) * (cell * 7 + 48);
      const from = utcWeek
        .offset(start, row * weeksPerRow)
        .toISOString()
        .slice(0, 10);
      labels.push({
        id: `${band}:${row}`,
        text: `${band} · weeks from ${from}`,
        x: MARGIN,
        y: rowTop,
        width: width - MARGIN * 2,
      });
    }
    for (const [day, sameDay] of group(entries, (node) => node.date)) {
      const date = new Date(`${day}T00:00:00Z`);
      const week = utcWeek.count(start, date);
      const subdivisions = Math.ceil(Math.sqrt(sameDay.length));
      const sub = cell / subdivisions;
      sameDay.forEach((node, i) =>
        targets.push({
          node,
          x:
            MARGIN +
            (week % weeksPerRow) * cell +
            ((i % subdivisions) + 0.5) * sub,
          y:
            top +
            (Math.floor(week / weeksPerRow) - firstRow) * (cell * 7 + 48) +
            40 +
            date.getUTCDay() * cell +
            (Math.floor(i / subdivisions) + 0.5) * sub,
          radius: Math.max(0.7, Math.min(6, sub * 0.32)),
        }),
      );
    }
    top += (lastRow - firstRow + 1) * (cell * 7 + 48) + 16;
  }
  return { nodes: targets, labels, height: Math.max(280, top + 16) };
}
