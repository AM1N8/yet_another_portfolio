import type { Portfolio } from "./content/types.ts";

export type HomepageSection =
  "hero" | "work" | "lab" | "timeline" | "about" | "stack" | "contact";

export function getSelectedProjects(portfolio: Portfolio) {
  return portfolio.projects.entries
    .filter((project) => project.visible && project.featured)
    .sort(
      (a, b) =>
        (a.featured_order ?? Number.MAX_SAFE_INTEGER) -
        (b.featured_order ?? Number.MAX_SAFE_INTEGER),
    )
    .slice(0, portfolio.homepage.selected_project_count);
}

export function getExperiments(portfolio: Portfolio) {
  if (!portfolio.experiments.visible) return [];
  return portfolio.experiments.entries
    .filter((entry) => entry.visible)
    .sort((a, b) => a.order - b.order)
    .slice(0, portfolio.homepage.experiment_count);
}

export function getTimelineEvents(portfolio: Portfolio) {
  if (!portfolio.timeline.visible) return [];
  return portfolio.timeline.events
    .filter(
      (event) =>
        event.visible &&
        (event.type !== "education" ||
          (portfolio.education.visible &&
            portfolio.homepage.show_education_in_timeline)) &&
        (event.type !== "experience" ||
          (portfolio.experience.visible &&
            portfolio.homepage.show_experience_in_timeline)) &&
        (event.type !== "activity" || portfolio.activities.visible),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPublicLinks(portfolio: Portfolio) {
  const labels = {
    github: "GitHub",
    linkedin: "LinkedIn",
    x_twitter: "X",
    bluesky: "Bluesky",
    mastodon: "Mastodon",
    scholar: "Google Scholar",
    huggingface: "Hugging Face",
    kaggle: "Kaggle",
    devto: "DEV",
    medium: "Medium",
    personal_blog: "Website",
  } as const;
  const links: { label: string; url: string }[] = Object.entries(
    labels,
  ).flatMap(([key, label]) => {
    const url = portfolio.contact.links[key as keyof typeof labels];
    return url ? [{ label, url }] : [];
  });
  links.push(...portfolio.contact.links.other);
  if (portfolio.contact.resume.visible && portfolio.contact.resume.url) {
    links.push({
      label: portfolio.contact.resume.label,
      url: portfolio.contact.resume.url,
    });
  }
  return links;
}

export function getHomepageSections(portfolio: Portfolio): HomepageSection[] {
  const visible: Record<HomepageSection, boolean> = {
    hero: true,
    work: getSelectedProjects(portfolio).length > 0,
    lab: getExperiments(portfolio).length > 0,
    timeline: getTimelineEvents(portfolio).length > 0,
    about: portfolio.about.visible && Boolean(portfolio.about.intro.trim()),
    stack:
      portfolio.skills.visible &&
      portfolio.skills.groups.some((group) => group.items.length > 0),
    contact:
      portfolio.contact.email_public ||
      Boolean(portfolio.contact.phone_public && portfolio.contact.phone) ||
      getPublicLinks(portfolio).length > 0,
  };
  const sections: HomepageSection[] = [];
  for (const section of portfolio.homepage.section_order) {
    // The legacy activity slot is retired; CDXV now belongs to the footer.
    if (section === "activity") continue;
    if (visible[section]) sections.push(section);
    if (section === "about" && visible.stack) sections.push("stack");
  }
  if (visible.stack && !sections.includes("stack")) {
    const contactIndex = sections.indexOf("contact");
    sections.splice(
      contactIndex < 0 ? sections.length : contactIndex,
      0,
      "stack",
    );
  }
  return [...new Set(sections)];
}
