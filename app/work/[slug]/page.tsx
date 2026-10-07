import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadPortfolio } from "@/lib/content/loadPortfolio";
import { findProject, getVisibleProjects } from "@/lib/projects";
import { CaseStudy } from "@/components/work/CaseStudy";
import "./case-study.css";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return getVisibleProjects(loadPortfolio()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const portfolio = loadPortfolio();
  const project = findProject(portfolio, (await params).slug);
  if (!project) notFound();
  const title = project.seo?.title || project.title;
  const description = project.seo?.description || project.one_liner;
  const url = new URL(`/work/${project.slug}`, portfolio.site.canonical_url)
    .href;
  const image =
    project.media?.hero ||
    project.media?.thumbnail ||
    portfolio.site.seo.og_image;
  return {
    title: portfolio.site.seo.title_template.replace("%s", title),
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      locale: portfolio.site.locale,
      siteName: portfolio.site.brand_label,
      ...(image
        ? {
            images: [
              {
                url: new URL(image, portfolio.site.canonical_url).href,
                alt: project.title,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image
        ? { images: [new URL(image, portfolio.site.canonical_url).href] }
        : {}),
    },
  };
}

export default async function ProjectPage({ params }: Props) {
  const project = findProject(loadPortfolio(), (await params).slug);
  if (!project) notFound();
  return <CaseStudy project={project} />;
}
