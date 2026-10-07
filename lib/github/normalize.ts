import type { Portfolio } from "../content/types.ts";
import { repositoryNameSchema } from "./schema.ts";
import type {
  DataIssue,
  GitHubData,
  GitHubSnapshot,
  GraphNode,
  LanguageDistribution,
  RepositoryAssociation,
  TimelineActivity,
} from "./types.ts";

export function emptySnapshot(username: string): GitHubSnapshot {
  return {
    version: 1,
    username,
    capturedAt: null,
    coverage: {
      repositoryListTruncated: false,
      eventFeedTruncated: false,
      contributionCalendar: false,
    },
    repositories: [],
    activity: [],
    contributions: [],
  };
}

export function getRepositoryAssociations(
  portfolio: Portfolio,
): RepositoryAssociation[] {
  const associations = new Map<string, RepositoryAssociation>();
  for (const project of portfolio.projects.entries) {
    const repository = project.activity?.github_repo;
    if (
      !project.visible ||
      !project.activity?.include_in_activity_graph ||
      !repository ||
      !repositoryNameSchema.safeParse(repository).success
    )
      continue;
    const key = repository.toLowerCase();
    const association = associations.get(key) ?? {
      repository,
      projectSlugs: [],
    };
    association.projectSlugs.push(project.slug);
    associations.set(key, association);
  }
  return [...associations.values()];
}

export function normalizeGitHubData(
  snapshot: GitHubSnapshot,
  portfolio: Portfolio,
  source: GitHubData["source"],
  issues: DataIssue[] = [],
): GitHubData {
  const associations = getRepositoryAssociations(portfolio);
  const byRepository = new Map(
    associations.map((entry) => [
      entry.repository.toLowerCase(),
      entry.projectSlugs,
    ]),
  );
  const repositories = [
    ...new Map(
      snapshot.repositories.map((repo) => [repo.fullName.toLowerCase(), repo]),
    ).values(),
  ].sort((a, b) => a.fullName.localeCompare(b.fullName));
  const repoLookup = new Map(
    repositories.map((repo) => [repo.fullName.toLowerCase(), repo]),
  );
  const activity = [
    ...new Map(snapshot.activity.map((event) => [event.id, event])).values(),
  ]
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
    .map((event) => ({
      ...event,
      date: event.occurredAt.slice(0, 10),
      projectSlugs: byRepository.get(event.repository.toLowerCase()) ?? [],
      language:
        repoLookup.get(event.repository.toLowerCase())?.primaryLanguage ?? null,
    }));
  const contributions = [
    ...new Map(
      snapshot.contributions.map((entry) => [entry.date, entry]),
    ).values(),
  ].sort((a, b) => a.date.localeCompare(b.date));
  const languageMap = new Map<string, LanguageDistribution>();
  for (const repo of repositories) {
    for (const [language, bytes] of Object.entries(repo.languages)) {
      if (bytes === 0) continue;
      const entry = languageMap.get(language) ?? {
        language,
        bytes: 0,
        share: 0,
        repositories: [],
      };
      entry.bytes += bytes;
      entry.repositories.push(repo.fullName);
      languageMap.set(language, entry);
    }
  }
  const languages = [...languageMap.values()].sort(
    (a, b) => b.bytes - a.bytes || a.language.localeCompare(b.language),
  );
  const totalBytes = languages.reduce((sum, entry) => sum + entry.bytes, 0);
  for (const language of languages)
    language.share = language.bytes / totalBytes;
  const timeline: TimelineActivity[] = repositories.map((repo) => ({
    id: `repository:${repo.fullName.toLowerCase()}`,
    kind: "repository",
    repository: repo.fullName,
    projectSlugs: byRepository.get(repo.fullName.toLowerCase()) ?? [],
    start: repo.createdAt,
    end: repo.pushedAt,
  }));
  for (const project of portfolio.projects.entries) {
    if (
      !project.visible ||
      !project.activity?.include_in_activity_graph ||
      (!project.dates?.start && !project.dates?.end)
    )
      continue;
    timeline.push({
      id: `project:${project.slug}`,
      kind: "project",
      repository: project.activity.github_repo ?? null,
      projectSlugs: [project.slug],
      start: project.dates?.start ?? null,
      end: project.dates?.end ?? null,
    });
  }
  const maxCount = Math.max(1, ...contributions.map((entry) => entry.count));
  const nodes: GraphNode[] = contributions.map((entry) => ({
    id: `contribution:${entry.date}`,
    kind: "contribution",
    date: entry.date,
    count: entry.count,
    unit: "contributions",
    intensity: entry.count / maxCount,
    repository: null,
    projectSlugs: [],
    language: null,
  }));
  nodes.push(
    ...activity.map((entry): GraphNode => ({
      id: `event:${entry.id}`,
      kind: "event",
      date: entry.date,
      count: 1,
      unit: "events",
      intensity: 1,
      repository: entry.repository,
      projectSlugs: entry.projectSlugs,
      language: entry.language,
    })),
  );
  const years = [
    ...new Set(nodes.map((node) => Number(node.date.slice(0, 4)))),
  ].sort((a, b) => b - a);
  return {
    username: snapshot.username,
    source,
    capturedAt: snapshot.capturedAt,
    issues,
    coverage: snapshot.coverage,
    repositories,
    associations,
    activity,
    contributions,
    languages,
    timeline,
    nodes,
    years,
  };
}
