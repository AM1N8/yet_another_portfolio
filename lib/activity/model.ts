import type { Portfolio } from "../content/types.ts";
import type { GitHubData, GraphNode } from "../github/types.ts";

export const MODES = ["activity", "projects", "languages", "timeline"] as const;
export type ActivityMode = (typeof MODES)[number];
export interface ActivityProject {
  slug: string;
  title: string;
  domains: string[];
}
export type ActivityConfig = Pick<
  Portfolio["activity_graph"],
  "default_view" | "views" | "appearance" | "interaction" | "performance"
> & { motion: boolean };
export interface ActivityModel {
  data: GitHubData;
  projects: ActivityProject[];
  config: ActivityConfig;
}

// Only public presentation data crosses the server/client boundary, never env names.
export function createActivityModel(
  data: GitHubData,
  portfolio: Portfolio,
): ActivityModel {
  const { default_view, views, appearance, interaction, performance } =
    portfolio.activity_graph;
  return {
    data,
    projects: portfolio.projects.entries
      .filter(
        (project) =>
          project.visible && project.activity?.include_in_activity_graph,
      )
      .map((project) => ({
        slug: project.slug,
        title: project.short_title || project.title,
        domains: project.domains,
      })),
    config: {
      default_view,
      views,
      appearance,
      interaction,
      performance,
      motion: portfolio.ui.motion.enabled,
    },
  };
}

export function projectForNode(node: GraphNode, projects: ActivityProject[]) {
  return projects.find((project) => node.projectSlugs.includes(project.slug));
}

export function nodeDescription(node: GraphNode, data: GitHubData): string {
  const event =
    node.kind === "event"
      ? data.activity.find((entry) => `event:${entry.id}` === node.id)
      : null;
  return `${node.date} · ${node.count} ${node.unit}${event ? ` · ${event.type}` : ""}${node.repository ? ` · ${node.repository}` : ""}${node.language ? ` · ${node.language}` : ""}`;
}

export function filterNodes(nodes: GraphNode[], year: string): GraphNode[] {
  return nodes.filter(
    (node) => year === "all" || node.date.startsWith(`${year}-`),
  );
}

// Deterministic sampling is shared by all modes, preserving node IDs across morphs.
// The complete dataset is always available in the text view.
export function visibleNodes(
  nodes: GraphNode[],
  width: number,
  config: ActivityConfig,
): GraphNode[] {
  const limits = config.performance;
  const limit = Math.max(
    1,
    width < 600
      ? limits.mobile_max_nodes
      : width < 1000
        ? limits.tablet_max_nodes
        : limits.desktop_max_nodes,
  );
  if (nodes.length <= limit) return nodes;
  return Array.from(
    { length: limit },
    (_, index) => nodes[Math.floor((index * nodes.length) / limit)],
  );
}
