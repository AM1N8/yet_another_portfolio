import "server-only";

import { z } from "zod";
import { githubSnapshotSchema, repositoryNameSchema } from "./schema.ts";
import type { DataIssue, GitHubSnapshot } from "./types.ts";

export const GITHUB_REVALIDATE_SECONDS = 3600;
const MAX_PAGES = 3;
const PAGE_SIZE = 100;
const REQUEST_TIMEOUT_MS = 8000;

export class GitHubFetchError extends Error {
  readonly issue: DataIssue;
  constructor(issue: DataIssue) {
    super(`GitHub data unavailable: ${issue}`);
    this.issue = issue;
  }
}

const repoSchema = z.object({
  full_name: repositoryNameSchema,
  html_url: z.string(),
  description: z.string().nullable(),
  language: z.string().nullable(),
  created_at: z.string(),
  pushed_at: z.string().nullable(),
  archived: z.boolean(),
  fork: z.boolean(),
  private: z.boolean(),
});
const eventSchema = z.object({
  id: z.string(),
  type: z.string(),
  public: z.boolean(),
  created_at: z.string(),
  repo: z.object({ name: repositoryNameSchema }),
});
const calendarSchema = z.object({
  data: z.object({
    user: z.object({
      contributionsCollection: z.object({
        contributionCalendar: z.object({
          weeks: z.array(
            z.object({
              contributionDays: z.array(
                z.object({
                  date: z.iso.date(),
                  contributionCount: z.number().int().nonnegative(),
                }),
              ),
            }),
          ),
        }),
      }),
    }),
  }),
  errors: z.array(z.unknown()).optional(),
});

export async function fetchGitHubSnapshot(
  username: string,
  token?: string,
  fetcher: typeof fetch = fetch,
): Promise<GitHubSnapshot> {
  if (!/^[\w-]+$/.test(username))
    throw new GitHubFetchError("missing-username");
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "portfolio-activity-data",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  async function request(path: string, body?: object): Promise<unknown> {
    try {
      const response = await fetcher(`https://api.github.com${path}`, {
        method: body ? "POST" : "GET",
        headers,
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        cache: "force-cache",
        next: { revalidate: GITHUB_REVALIDATE_SECONDS },
      });
      if (!response.ok) {
        const rateLimited =
          response.status === 429 ||
          (response.status === 403 &&
            (response.headers.get("x-ratelimit-remaining") === "0" ||
              response.headers.has("retry-after")));
        throw new GitHubFetchError(rateLimited ? "rate-limited" : "api-error");
      }
      try {
        return await response.json();
      } catch {
        throw new GitHubFetchError("invalid-response");
      }
    } catch (error) {
      // Never propagate upstream messages, request headers, or token-bearing error objects.
      throw error instanceof GitHubFetchError
        ? error
        : new GitHubFetchError("network-error");
    }
  }
  async function pages<T>(
    path: string,
    schema: z.ZodType<T>,
  ): Promise<{ items: T[]; truncated: boolean }> {
    const items: T[] = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
      const result = z
        .array(schema)
        .safeParse(await request(`${path}&per_page=${PAGE_SIZE}&page=${page}`));
      if (!result.success) throw new GitHubFetchError("invalid-response");
      items.push(...result.data);
      if (result.data.length < PAGE_SIZE) return { items, truncated: false };
    }
    return { items, truncated: true };
  }
  const repos = await pages(
    `/users/${encodeURIComponent(username)}/repos?type=owner&sort=pushed`,
    repoSchema,
  );
  const events = await pages(
    `/users/${encodeURIComponent(username)}/events/public?`,
    eventSchema,
  );
  const repositories: GitHubSnapshot["repositories"] = [];
  // Keep API fan-out bounded; snapshots are refreshed hourly rather than per visitor.
  const publicRepos = repos.items.filter((repo) => !repo.private);
  for (let offset = 0; offset < publicRepos.length; offset += 5) {
    const batch = await Promise.all(
      publicRepos.slice(offset, offset + 5).map(async (repo) => {
        const languages = z
          .record(z.string(), z.number().int().nonnegative())
          .safeParse(await request(`/repos/${repo.full_name}/languages`));
        if (!languages.success) throw new GitHubFetchError("invalid-response");
        return {
          fullName: repo.full_name,
          url: repo.html_url,
          description: repo.description,
          primaryLanguage: repo.language,
          languages: languages.data,
          createdAt: repo.created_at,
          pushedAt: repo.pushed_at,
          archived: repo.archived,
          fork: repo.fork,
        };
      }),
    );
    repositories.push(...batch);
  }
  let contributions: GitHubSnapshot["contributions"] = [];
  if (token) {
    const response = calendarSchema.safeParse(
      await request("/graphql", {
        query:
          "query($login: String!) { user(login: $login) { contributionsCollection { contributionCalendar { weeks { contributionDays { date contributionCount } } } } } }",
        variables: { login: username },
      }),
    );
    if (!response.success || response.data.errors?.length)
      throw new GitHubFetchError("invalid-response");
    contributions =
      response.data.data.user.contributionsCollection.contributionCalendar.weeks.flatMap(
        (week) =>
          week.contributionDays.map((day) => ({
            date: day.date,
            count: day.contributionCount,
          })),
      );
  }
  const result = githubSnapshotSchema.safeParse({
    version: 1,
    username,
    capturedAt: new Date().toISOString(),
    coverage: {
      repositoryListTruncated: repos.truncated,
      eventFeedTruncated: events.truncated,
      contributionCalendar: Boolean(token),
    },
    repositories,
    activity: events.items
      .filter((event) => event.public)
      .map((event) => ({
        id: event.id,
        type: event.type,
        repository: event.repo.name,
        occurredAt: event.created_at,
      })),
    contributions,
  });
  if (!result.success) throw new GitHubFetchError("invalid-response");
  return result.data;
}
