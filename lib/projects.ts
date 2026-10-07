import type { Portfolio, Project, ContentLink } from "./content/types.ts";

export function getVisibleProjects(portfolio: Portfolio) {
  return portfolio.projects.entries.filter((project) => project.visible);
}

export function findProject(portfolio: Portfolio, slug: string) {
  return getVisibleProjects(portfolio).find((project) => project.slug === slug);
}

export function getProjectLinks(project: Project): ContentLink[] {
  const labels = {
    github: "Repository",
    live_demo: "Live demo",
    paper: "Paper",
    article: "Article",
    video: "Video",
    documentation: "Documentation",
  } as const;
  return [
    ...Object.entries(labels).flatMap(([key, label]) => {
      const url = project.links?.[key as keyof typeof labels];
      return url ? [{ label, url }] : [];
    }),
    ...(project.links?.other ?? []),
  ];
}

export function getProjectSections(project: Project) {
  const candidates = [
    { id: "problem", title: "Problem", text: project.problem },
    { id: "motivation", title: "Why it matters", text: project.why_it_matters },
    { id: "constraints", title: "Constraints", items: project.constraints },
    { id: "approach", title: "Technical approach", text: project.approach },
    {
      id: "decisions",
      title: "Engineering decisions",
      items: project.engineering_decisions,
    },
    { id: "challenges", title: "Challenges", items: project.challenges },
    { id: "iterations", title: "Iterations", items: project.iterations },
    { id: "lessons", title: "Lessons", text: project.lessons },
    { id: "next-steps", title: "Next steps", text: project.next_steps },
  ];
  return candidates.filter(
    (section) => section.text?.trim() || section.items?.length,
  );
}
