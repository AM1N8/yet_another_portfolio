import "server-only";

import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { cache } from "react";
import { loadPortfolio } from "../content/loadPortfolio.ts";
import type { Portfolio } from "../content/types.ts";
import { fetchGitHubSnapshot, GitHubFetchError } from "./fetch.ts";
import { emptySnapshot, normalizeGitHubData } from "./normalize.ts";
import { githubSnapshotSchema } from "./schema.ts";
import type { DataIssue, GitHubData, GitHubSnapshot } from "./types.ts";

export function getSnapshotPath(path: string): string {
  const publicRoot = resolve(process.cwd(), "public");
  const target = resolve(publicRoot, path.replace(/^\//, ""));
  if (
    !path.startsWith("/") ||
    !target.startsWith(`${publicRoot}${sep}`) ||
    !target.endsWith(".json")
  )
    throw new Error("Invalid GitHub snapshot path");
  return target;
}

export async function readGitHubFallback(
  path: string,
  username: string,
): Promise<GitHubSnapshot | null> {
  try {
    const result = githubSnapshotSchema.safeParse(
      JSON.parse(await readFile(getSnapshotPath(path), "utf8")),
    );
    return result.success &&
      result.data.username.toLowerCase() === username.toLowerCase()
      ? result.data
      : null;
  } catch {
    return null;
  }
}

export async function resolveGitHubData(
  portfolio: Portfolio,
  options: {
    fetcher?: typeof fetch;
    token?: string;
    readFallback?: typeof readGitHubFallback;
  } = {},
): Promise<GitHubData> {
  const config = portfolio.activity_graph;
  const username = config.github_username ?? "";
  const empty = (issues: DataIssue[]) =>
    normalizeGitHubData(emptySnapshot(username), portfolio, "empty", issues);
  if (!config.enabled) return empty(["disabled"]);
  if (!username || !/^[\w-]+$/.test(username))
    return empty(["missing-username"]);
  const issues: DataIssue[] = [];
  if (config.source === "github") {
    try {
      // Read only on the server, and only when the GitHub source is selected.
      const token =
        options.token ??
        (config.github_token_env &&
        !config.github_token_env.startsWith("NEXT_PUBLIC_")
          ? process.env[config.github_token_env]
          : undefined);
      return normalizeGitHubData(
        await fetchGitHubSnapshot(username, token, options.fetcher),
        portfolio,
        "github",
      );
    } catch (error) {
      issues.push(
        error instanceof GitHubFetchError ? error.issue : "api-error",
      );
    }
    if (!config.fallback.show_if_api_unavailable) return empty(issues);
  }
  const snapshot = await (options.readFallback ?? readGitHubFallback)(
    config.fallback.static_data_path,
    username,
  );
  return snapshot
    ? normalizeGitHubData(snapshot, portfolio, "fallback", issues)
    : empty([...issues, "fallback-unavailable"]);
}

// Request-level deduplication complements Next's persistent fetch cache/revalidation.
export const loadGitHubData = cache(async (): Promise<GitHubData> =>
  resolveGitHubData(loadPortfolio()),
);
