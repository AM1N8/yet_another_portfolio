import assert from "node:assert/strict";
import test from "node:test";
import { loadPortfolio } from "../lib/content/loadPortfolio.ts";
import {
  fetchGitHubSnapshot,
  GITHUB_REVALIDATE_SECONDS,
} from "../lib/github/fetch.ts";
import {
  getSnapshotPath,
  readGitHubFallback,
  resolveGitHubData,
} from "../lib/github/loadGitHubData.ts";
import { emptySnapshot, normalizeGitHubData } from "../lib/github/normalize.ts";
import { githubSnapshotSchema } from "../lib/github/schema.ts";
import type { GitHubSnapshot } from "../lib/github/types.ts";

const portfolio = loadPortfolio();
const username = portfolio.activity_graph.github_username!;
const knownRepo = portfolio.projects.entries.find(
  (project) => project.activity?.github_repo,
)?.activity?.github_repo;
assert.ok(knownRepo);
const timestamp = "2026-01-02T12:00:00Z";
const repository = (fullName: string) => ({
  full_name: fullName,
  html_url: `https://github.com/${fullName}`,
  description: null,
  language: "TypeScript",
  created_at: timestamp,
  pushed_at: timestamp,
  archived: false,
  fork: false,
  private: false,
});
const json = (value: unknown) =>
  new Response(JSON.stringify(value), { status: 200 });

test("normalization keeps verified counts, case-insensitive associations, unknown repositories and byte shares", () => {
  const snapshot: GitHubSnapshot = {
    ...emptySnapshot(username),
    capturedAt: timestamp,
    repositories: [knownRepo, `${username}/unknown`].map((fullName) => ({
      fullName,
      url: `https://github.com/${fullName}`,
      description: null,
      primaryLanguage: "TypeScript",
      languages: { TypeScript: 60, Python: 40 },
      createdAt: timestamp,
      pushedAt: null,
      archived: false,
      fork: false,
    })),
    activity: [
      {
        id: "1",
        type: "PushEvent",
        repository: knownRepo.toLowerCase(),
        occurredAt: timestamp,
      },
      {
        id: "2",
        type: "IssuesEvent",
        repository: `${username}/unknown`,
        occurredAt: timestamp,
      },
    ],
    contributions: [
      { date: "2026-01-02", count: 4 },
      { date: "2026-01-01", count: 0 },
    ],
  };
  const before = JSON.stringify(snapshot);
  const data = normalizeGitHubData(snapshot, portfolio, "github");
  assert.equal(data.activity[0].projectSlugs.length, 1);
  assert.deepEqual(data.activity[1].projectSlugs, []);
  assert.equal(data.languages[0].bytes, 120);
  assert.equal(data.languages[0].share, 0.6);
  assert.equal(
    data.nodes.find((node) => node.id === "contribution:2026-01-02")?.count,
    4,
  );
  assert.equal(data.nodes.filter((node) => node.unit === "events").length, 2);
  assert.deepEqual(data.years, [2026]);
  assert.ok(
    data.timeline.some((entry) => entry.repository === `${username}/unknown`),
  );
  assert.equal(JSON.stringify(snapshot), before);
});

test("unauthenticated REST data is cached and never masquerades as a contribution calendar", async () => {
  const requests: RequestInit[] = [];
  const fetcher: typeof fetch = async (input, init) => {
    requests.push(init!);
    const url = String(input);
    if (url.includes("/languages")) return json({ TypeScript: 100 });
    if (url.includes("/events/public"))
      return json([
        {
          id: "1",
          type: "PushEvent",
          public: true,
          created_at: timestamp,
          repo: { name: knownRepo },
        },
      ]);
    return json([repository(knownRepo)]);
  };
  const snapshot = await fetchGitHubSnapshot(username, undefined, fetcher);
  assert.equal(snapshot.activity.length, 1);
  assert.deepEqual(snapshot.contributions, []);
  assert.equal(snapshot.coverage.contributionCalendar, false);
  for (const request of requests) {
    assert.equal(request.cache, "force-cache");
    assert.equal(
      (request as RequestInit & { next: { revalidate: number } }).next
        .revalidate,
      GITHUB_REVALIDATE_SECONDS,
    );
    assert.equal(new Headers(request.headers).has("Authorization"), false);
  }
});

test("authenticated calendar is normalized, and the token never enters returned data", async () => {
  const token = "fixture-secret-do-not-serialize";
  const fetcher: typeof fetch = async (input, init) => {
    assert.equal(
      new Headers(init?.headers).get("Authorization"),
      `Bearer ${token}`,
    );
    const url = String(input);
    if (url.endsWith("/graphql"))
      return json({
        data: {
          user: {
            contributionsCollection: {
              contributionCalendar: {
                weeks: [
                  {
                    contributionDays: [
                      { date: "2026-01-02", contributionCount: 3 },
                    ],
                  },
                ],
              },
            },
          },
        },
      });
    return json([]);
  };
  const snapshot = await fetchGitHubSnapshot(username, token, fetcher);
  assert.deepEqual(snapshot.contributions, [{ date: "2026-01-02", count: 3 }]);
  assert.equal(snapshot.coverage.contributionCalendar, true);
  assert.equal(JSON.stringify(snapshot).includes(token), false);
});

test("rate limits, network failures and malformed payloads resolve to the validated fallback without leaking errors", async () => {
  const fallback = emptySnapshot(username);
  const failures: Array<{ fetcher: typeof fetch; issue: string }> = [
    {
      fetcher: async () =>
        new Response(null, {
          status: 403,
          headers: { "x-ratelimit-remaining": "0" },
        }),
      issue: "rate-limited",
    },
    {
      fetcher: async () => new Response(null, { status: 429 }),
      issue: "rate-limited",
    },
    {
      fetcher: async () => new Response(null, { status: 500 }),
      issue: "api-error",
    },
    {
      fetcher: async () => {
        throw new Error("secret upstream message");
      },
      issue: "network-error",
    },
    {
      fetcher: async () => json({ unexpected: true }),
      issue: "invalid-response",
    },
  ];
  for (const { fetcher, issue } of failures) {
    const data = await resolveGitHubData(portfolio, {
      fetcher,
      token: "fixture-secret",
      readFallback: async () => fallback,
    });
    assert.equal(data.source, "fallback");
    assert.deepEqual(data.issues, [issue]);
    assert.equal(JSON.stringify(data).includes("secret"), false);
  }
});

test("static, disabled, fallback-disabled and missing-fallback configurations stay deterministic", async () => {
  const staticPortfolio = structuredClone(portfolio);
  staticPortfolio.activity_graph.source = "static";
  const fetcher: typeof fetch = async () => {
    assert.fail("must not fetch");
  };
  assert.equal(
    (await resolveGitHubData(staticPortfolio, { fetcher })).source,
    "fallback",
  );
  staticPortfolio.activity_graph.enabled = false;
  assert.deepEqual(
    (await resolveGitHubData(staticPortfolio, { fetcher })).issues,
    ["disabled"],
  );
  const noFallback = structuredClone(portfolio);
  noFallback.activity_graph.fallback.show_if_api_unavailable = false;
  const fail: typeof fetch = async () => new Response(null, { status: 500 });
  assert.equal(
    (
      await resolveGitHubData(noFallback, {
        fetcher: fail,
        readFallback: async () => {
          assert.fail("must not read fallback");
        },
      })
    ).source,
    "empty",
  );
  const missing = await resolveGitHubData(portfolio, {
    fetcher: fail,
    readFallback: async () => null,
  });
  assert.deepEqual(missing.issues, ["api-error", "fallback-unavailable"]);
  assert.deepEqual(missing.nodes, []);
});

test("committed fallback is valid and honest; invalid paths, users and credential-bearing snapshots are rejected", async () => {
  const fallback = await readGitHubFallback(
    portfolio.activity_graph.fallback.static_data_path,
    username,
  );
  assert.ok(fallback);
  assert.equal(fallback.capturedAt, null);
  assert.deepEqual(fallback.contributions, []);
  assert.equal(
    await readGitHubFallback(
      portfolio.activity_graph.fallback.static_data_path,
      "someone-else",
    ),
    null,
  );
  assert.throws(() => getSnapshotPath("/../content/portfolio.yaml"));
  assert.throws(() => getSnapshotPath("https://example.com/data.json"));
  assert.equal(
    githubSnapshotSchema.safeParse({ ...fallback, token: "secret" }).success,
    false,
  );
});
