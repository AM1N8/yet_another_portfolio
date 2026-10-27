import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadPortfolio } from "@/lib/content/loadPortfolio";
import {
  filterGallery,
  galleryUrl,
  getGalleryItems,
  readGalleryState,
} from "@/lib/gallery";
import { GalleryBrowser } from "@/components/gallery/GalleryBrowser";
import { GalleryImage } from "@/components/gallery/GalleryImage";
import "./gallery.css";

export function generateMetadata(): Metadata {
  const portfolio = loadPortfolio();
  const title = `Gallery — ${portfolio.gallery.title}`;
  const url = new URL("/gallery", portfolio.site.canonical_url).href;
  return {
    title: portfolio.site.seo.title_template.replace("%s", title),
    description: portfolio.gallery.description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: portfolio.gallery.description,
      url,
      type: "website",
      siteName: portfolio.site.brand_label,
    },
  };
}
export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const portfolio = loadPortfolio();
  if (!portfolio.gallery.visible) notFound();
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams))
    if (typeof value === "string") params.set(key, value);
  const initial = readGalleryState(params);
  const items = getGalleryItems(portfolio);
  const matching = new Set(
    filterGallery(items, initial).map((item) => item.id),
  );
  const selected = items.find((item) => item.id === initial.item);
  return (
    <section className="gallery-page" aria-labelledby="gallery-title">
      <header className="archive-header">
        <p className="label">{portfolio.gallery.section_number} / GALLERY</p>
        <h1 id="gallery-title">{portfolio.gallery.title}</h1>
        <div>
          <p>{portfolio.gallery.description}</p>
          <p className="label">
            {String(items.length).padStart(3, "0")} / VISIBLE ARTIFACTS
          </p>
        </div>
      </header>
      <GalleryBrowser
        key={galleryUrl(initial)}
        items={items}
        initial={initial}
        brand={portfolio.site.brand_label}
      >
        <div className="archive-sheet" aria-label="Gallery artifacts">
          {items.map((item) => (
            <article
              key={item.id}
              data-artifact={item.id}
              data-featured={item.featured}
              hidden={!matching.has(item.id)}
            >
              <a
                className="archive-entry"
                href={galleryUrl({ ...initial, item: item.id })}
                data-gallery-open={item.id}
                aria-label={`View ${item.title}`}
              >
                <div className="archive-visual">
                  <GalleryImage
                    src={item.thumbnail || item.image}
                    alt={item.alt}
                    width={item.width}
                    height={item.height}
                    sizes={
                      item.featured
                        ? "(min-width: 1200px) 850px, (min-width: 768px) 60vw, 100vw"
                        : "(min-width: 1200px) 620px, (min-width: 768px) 50vw, 100vw"
                    }
                  />
                </div>
                <div className="archive-entry-meta">
                  <span className="label archive-number">{item.number}</span>
                  <h2>{item.title}</h2>
                  <span className="label archive-type">{item.type}</span>
                  <span className="label archive-year">
                    {item.date?.slice(0, 4) || "—"}
                  </span>
                </div>
                {item.projectTitle && (
                  <p className="archive-project">{item.projectTitle}</p>
                )}
              </a>
              {item.projectHref && (
                <a
                  className="archive-project-link label"
                  href={item.projectHref}
                >
                  CASE STUDY ↗
                </a>
              )}
            </article>
          ))}
        </div>
      </GalleryBrowser>
      <noscript>
        {selected && (
          <section className="artifact-static">
            <h2>{selected.title}</h2>
            <GalleryImage
              src={selected.image}
              alt={selected.alt}
              width={selected.width}
              height={selected.height}
              sizes="100vw"
            />
            {selected.caption && <p>{selected.caption}</p>}
            <a href={galleryUrl({ ...initial, item: "" })}>Close artifact</a>
          </section>
        )}
        <p className="label">
          Use the filter form to browse. Enable JavaScript for the keyboard
          artifact viewer.
        </p>
      </noscript>
    </section>
  );
}
