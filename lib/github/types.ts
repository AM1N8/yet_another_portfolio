import type { GitHubSnapshot } from "./schema.ts";

export type { GitHubSnapshot } from "./schema.ts";
export type ContributionEntry = GitHubSnapshot["contributions"][number];
export type GitHubRepository = GitHubSnapshot["repositories"][number];
export type DataIssue =
  | "disabled"
  | "missing-username"
  | "rate-limited"
  | "api-error"
  | "invalid-response"
  | "network-error"
  | "fallback-unavailable";

export interface RepositoryAssociation {
  repository: string;
  projectSlugs: string[];
}

export type ActivityEntry = GitHubSnapshot["activity"][number] & {
  date: string;
  projectSlugs: string[];
  language: string | null;
};

export interface LanguageDistribution {
  language: string;
  bytes: number;
  share: number;
  repositories: string[];
}

export interface TimelineActivity {
  id: string;
  kind: "repository" | "project";
  repository: string | null;
  projectSlugs: string[];
  start: string | null;
  end: string | null;
}

// Position/target coordinates belong to the future renderer, not to API data.
export interface GraphNode {
  id: string;
  kind: "contribution" | "event";
  date: string;
  count: number;
  unit: "contributions" | "events";
  intensity: number;
  repository: string | null;
  projectSlugs: string[];
  language: string | null;
}

export interface GitHubData {
  username: string;
  source: "github" | "fallback" | "empty";
  capturedAt: string | null;
  issues: DataIssue[];
  coverage: GitHubSnapshot["coverage"];
  repositories: GitHubRepository[];
  associations: RepositoryAssociation[];
  activity: ActivityEntry[];
  contributions: ContributionEntry[];
  languages: LanguageDistribution[];
  timeline: TimelineActivity[];
  nodes: GraphNode[];
  years: number[];
}
