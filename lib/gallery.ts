import type { GalleryItem, Portfolio } from "./content/types.ts";

export const GALLERY_TYPES = [
  "project",
  "demo",
  "experiment",
  "architecture",
  "result",
  "interface",
  "visualization",
] as const;

export type ArchiveItem = GalleryItem & {
  projectTitle: string | null;
  projectHref: string | null;
  githubHref: string | null;
  number: string;
};
export type GalleryState = {
  type: string;
  project: string;
  year: string;
  q: string;
  view: "grid" | "index";
  item: string;
};
export function readGalleryState(params: URLSearchParams): GalleryState {
  return {
    type: params.get("type") || "",
    project: params.get("project") || "",
    year: params.get("year") || "",
    q: (params.get("q") || "").slice(0, 200),
    view: params.get("view") === "index" ? "index" : "grid",
    item: params.get("item") || "",
  };
}
export function galleryUrl(state: GalleryState): string {
  const params = new URLSearchParams();
  for (const key of ["type", "project", "year", "q", "view", "item"] as const) {
    if (state[key] && !(key === "view" && state.view === "grid"))
      params.set(key, state[key]);
  }
  return `/gallery${params.size ? `?${params}` : ""}`;
}
export function getGalleryItems(portfolio: Portfolio): ArchiveItem[] {
  if (!portfolio.gallery.visible) return [];
  return portfolio.gallery.items
    .filter(
      (item) =>
        item.visible &&
        (!item.project_slug ||
          portfolio.projects.entries.some(
            (project) => project.visible && project.slug === item.project_slug,
          )),
    )
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .map((item, index) => {
      const project = portfolio.projects.entries.find(
        (entry) => entry.slug === item.project_slug,
      );
      return {
        ...item,
        projectTitle: project?.title || null,
        projectHref:
          item.links?.project || (project ? `/work/${project.slug}` : null),
        githubHref: item.links?.github || project?.links?.github || null,
        number: String(index + 1).padStart(3, "0"),
      };
    });
}
export function filterGallery(
  items: ArchiveItem[],
  state: GalleryState,
): ArchiveItem[] {
  const terms = state.q.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return items.filter(
    (item) =>
      (!state.type || item.type === state.type) &&
      (!state.project || item.project_slug === state.project) &&
      (!state.year || item.date?.slice(0, 4) === state.year) &&
      terms.every((term) =>
        [item.title, item.projectTitle, item.caption, ...item.tags]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase()
          .includes(term),
      ),
  );
}
