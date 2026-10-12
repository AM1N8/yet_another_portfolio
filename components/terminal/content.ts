import type { Portfolio } from "../../lib/content/types.ts";
import { getProjectLinks, getProjectSections } from "../../lib/projects.ts";

export type VirtualEntry =
  | { path: string; kind: "directory" }
  | { path: string; kind: "file"; content: string };

export type TerminalContent = {
  brand: string;
  user: string;
  home: string;
  hostname: string;
  fullName: string;
  role: string;
  location: string | null;
  education: string[];
  focus: string[];
  timezone: string;
  links: {
    github: string | null;
    linkedin: string | null;
    resume: string | null;
  };
  projects: {
    slug: string;
    title: string;
    summary: string;
    featured: boolean;
  }[];
  skills: { name: string; items: string[] }[];
  contact: string;
  files: VirtualEntry[];
};

// Content is displayed as text, never interpreted as terminal control sequences.
export function plainText(value: string): string {
  return value.replace(/[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g, "");
}

export function createTerminalContent(portfolio: Portfolio): TerminalContent {
  const user =
    portfolio.identity.preferred_name
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "") || "visitor";
  const home = `/home/${user}`;
  const skills = portfolio.skills.visible
    ? portfolio.skills.groups.filter((group) => group.items.length)
    : [];
  const projects = portfolio.projects.entries
    .filter((project) => project.visible)
    .sort(
      (a, b) =>
        (a.featured_order ?? Number.MAX_SAFE_INTEGER) -
        (b.featured_order ?? Number.MAX_SAFE_INTEGER),
    );
  const links = {
    github: portfolio.contact.links.github || null,
    linkedin: portfolio.contact.links.linkedin || null,
    resume: portfolio.contact.resume.visible
      ? portfolio.contact.resume.url || null
      : null,
  };
  const contact = [
    portfolio.contact.email_public ? portfolio.contact.email : null,
    portfolio.contact.phone_public ? portfolio.contact.phone : null,
    ...Object.entries(links).flatMap(([name, url]) =>
      url ? [`${name}: ${url}`] : [],
    ),
  ]
    .filter(Boolean)
    .join("\n");
  const files: VirtualEntry[] = [];
  const directory = (path: string) => files.push({ path, kind: "directory" });
  const file = (path: string, content: string) =>
    files.push({ path, kind: "file", content: plainText(content.trim()) });
  [
    "/",
    "/home",
    home,
    "/etc",
    `${home}/skills`,
    `${home}/projects`,
    `${home}/lab`,
  ].forEach(directory);
  file(
    `${home}/README.md`,
    `# ${portfolio.identity.full_name}\n\n${portfolio.identity.headline}\n\n${portfolio.identity.positioning_statement.trim()}\n\nBrowse projects/, skills/, lab/, about.txt and contact.txt.\nUse help to explore this browser-side portfolio shell.`,
  );
  file(
    `${home}/about.txt`,
    portfolio.about.visible
      ? [
          portfolio.about.intro,
          portfolio.about.philosophy,
          ...portfolio.about.interests,
        ]
          .filter(Boolean)
          .join("\n\n")
      : portfolio.identity.positioning_statement,
  );
  file(`${home}/contact.txt`, contact);
  for (const group of skills) {
    const name = group.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    file(
      `${home}/skills/${name}.txt`,
      `${group.name}\n${group.items.join("\n")}`,
    );
  }
  for (const project of projects) {
    directory(`${home}/projects/${project.slug}`);
    file(
      `${home}/projects/${project.slug}/README.md`,
      [
        `# ${project.title}`,
        project.one_liner,
        project.summary,
        `Status: ${project.status}`,
        project.year ? `Year: ${project.year}` : null,
        project.role ? `Role: ${project.role}` : null,
        ...getProjectSections(project).map(
          (section) =>
            `## ${section.title}\n${section.text || section.items?.join("\n") || ""}`,
        ),
        project.architecture?.summary,
        ...(project.results || []).map(
          (result) =>
            `${result.label}: ${result.value}${result.context ? ` — ${result.context}` : ""}`,
        ),
        project.technologies.length
          ? `Stack: ${project.technologies.join(", ")}`
          : null,
        `Case study: /work/${project.slug}`,
        ...getProjectLinks(project).map((link) => `${link.label}: ${link.url}`),
      ]
        .filter(Boolean)
        .join("\n\n"),
    );
  }
  if (portfolio.experiments.visible) {
    for (const experiment of portfolio.experiments.entries.filter(
      (entry) => entry.visible,
    )) {
      directory(`${home}/lab/${experiment.slug}`);
      file(
        `${home}/lab/${experiment.slug}/README.md`,
        [
          experiment.title,
          experiment.domain,
          experiment.summary,
          experiment.github,
          experiment.live_demo,
        ]
          .filter(Boolean)
          .join("\n\n"),
      );
    }
  }
  const hostname = new URL(portfolio.site.canonical_url).hostname.split(".")[0];
  file("/etc/hostname", hostname);
  file(
    "/etc/motd",
    `${portfolio.site.brand_label} / PORTFOLIO TERMINAL\nA read-only, browser-side shell. Type help to begin.`,
  );
  return {
    brand: portfolio.site.brand_label,
    user,
    home,
    hostname,
    fullName: portfolio.identity.full_name,
    role: portfolio.identity.headline,
    location: portfolio.identity.location.show_on_site
      ? portfolio.identity.location.display
      : null,
    education: portfolio.education.visible
      ? portfolio.education.entries
          .filter((entry) => entry.visible && entry.current)
          .map((entry) => entry.institution)
      : [],
    focus: portfolio.about.visible ? portfolio.about.interests.slice(0, 4) : [],
    timezone: portfolio.identity.timezone,
    links,
    projects: projects.map((project) => ({
      slug: project.slug,
      title: project.title,
      summary: project.one_liner,
      featured: project.featured,
    })),
    skills,
    contact,
    files,
  };
}
