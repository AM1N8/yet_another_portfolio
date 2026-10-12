import type { Portfolio } from "./content/types.ts";
import { getHomepageSections } from "./homepage.ts";
import { findProject } from "./projects.ts";

export type NavigationItem = {
  label: string;
  href: string;
  available: boolean;
};

export type Command = {
  id: string;
  label: string;
  group:
    | "Navigate"
    | "Projects"
    | "Experiments"
    | "Appearance"
    | "Links"
    | "Contact"
    | "Tools";
  available: boolean;
} & (
  | { kind: "link"; href: string }
  | { kind: "theme" | "system-theme" | "terminal" }
  | { kind: "copy-email"; email: string }
);

export function isDestinationAvailable(
  href: string,
  portfolio: Portfolio,
): boolean {
  if (href === "/" || /^https?:\/\//.test(href)) return true;
  const projectSlug = href.match(/^\/work\/([\w-]+)$/)?.[1];
  if (projectSlug) return Boolean(findProject(portfolio, projectSlug));
  const section = href.match(/^\/?#([\w-]+)$/)?.[1];
  return getHomepageSections(portfolio).some(
    (entry) => (entry === "hero" ? "home" : entry) === section,
  );
}

export function getNavigation(portfolio: Portfolio): NavigationItem[] {
  return portfolio.navigation.items
    .filter((item) => item.visible)
    .map((item) => ({
      label: item.label,
      href: item.href,
      available: isDestinationAvailable(item.href, portfolio),
    }));
}

export function getCommands(portfolio: Portfolio): Command[] {
  if (!portfolio.command_palette.enabled) return [];
  const actions = portfolio.command_palette.actions;
  const commands: Command[] = [];
  if (actions.navigation) {
    for (const item of getNavigation(portfolio)) {
      commands.push({
        id: `navigation-${item.href}`,
        label: item.label,
        group: "Navigate",
        kind: "link",
        href: item.href,
        available: item.available,
      });
    }
  }
  if (actions.projects) {
    for (const project of portfolio.projects.entries.filter(
      (entry) => entry.visible,
    )) {
      commands.push({
        id: `project-${project.slug}`,
        label: project.title,
        group: "Projects",
        kind: "link",
        href: `/work/${project.slug}`,
        available: true,
      });
    }
  }
  if (actions.experiments && portfolio.experiments.visible) {
    for (const experiment of portfolio.experiments.entries.filter(
      (entry) => entry.visible,
    )) {
      // Existing external destinations work without inventing an experiment route.
      const href = experiment.live_demo || experiment.github;
      if (href)
        commands.push({
          id: `experiment-${experiment.slug}`,
          label: `Open ${experiment.title}${!experiment.live_demo ? " repository" : ""}`,
          group: "Experiments",
          kind: "link",
          href,
          available: true,
        });
    }
  }
  if (actions.theme_toggle) {
    commands.push({
      id: "toggle-theme",
      label: `Toggle ${portfolio.site.theme_toggle_labels.dark} / ${portfolio.site.theme_toggle_labels.light}`,
      group: "Appearance",
      kind: "theme",
      available: true,
    });
    commands.push({
      id: "system-theme",
      label: "Use system theme",
      group: "Appearance",
      kind: "system-theme",
      available: true,
    });
  }
  const socialLinks = [
    {
      enabled: actions.github,
      href: portfolio.contact.links.github,
      label: "Open GitHub",
      id: "github",
    },
    {
      enabled: actions.linkedin,
      href: portfolio.contact.links.linkedin,
      label: "Open LinkedIn",
      id: "linkedin",
    },
    {
      enabled: actions.resume && portfolio.contact.resume.visible,
      href: portfolio.contact.resume.url,
      label: `Open ${portfolio.contact.resume.label}`,
      id: "resume",
    },
  ];
  for (const link of socialLinks) {
    if (link.enabled && link.href)
      commands.push({
        id: link.id,
        label: link.label,
        group: "Links",
        kind: "link",
        href: link.href,
        available: true,
      });
  }
  if (actions.copy_email && portfolio.contact.email_public) {
    commands.push({
      id: "copy-email",
      label: "Copy email",
      group: "Contact",
      kind: "copy-email",
      email: portfolio.contact.email,
      available: true,
    });
  }
  commands.push({
    id: "terminal",
    label: "TERMINAL",
    group: "Tools",
    kind: "terminal",
    available: true,
  });
  return commands;
}
