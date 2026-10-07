import Image from "next/image";
import Link from "next/link";
import type { Portfolio, Project } from "@/lib/content/types";
import { getSelectedProjects } from "@/lib/homepage";
import { getProjectLinks } from "@/lib/projects";
import { SectionHeading } from "./SectionHeading";

function ProjectVisual({ project }: { project: Project }) {
  const image =
    project.media?.hero ||
    project.architecture?.diagram ||
    project.media?.architecture_diagram ||
    project.media?.thumbnail;
  if (image)
    return (
      <div className="project-image">
        <Image
          src={image}
          alt={`${project.title} — ${project.one_liner}`}
          fill
          sizes="(min-width: 1024px) 55vw, 100vw"
          unoptimized={image.startsWith("http")}
        />
      </div>
    );
  const components = project.architecture?.components;
  if (!components?.length) return null;
  return (
    <figure className="project-system">
      <figcaption className="label text-muted">
        <span>System components</span>
        <span>{String(components.length).padStart(2, "0")} elements</span>
      </figcaption>
      <ol className="system-components">
        {components.map((component, index) => (
          <li key={component}>
            <span className="label text-muted" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>{component}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}

export function SelectedWork({
  portfolio,
  index,
}: {
  portfolio: Portfolio;
  index: number;
}) {
  return (
    <section
      id="work"
      className="home-section selected-work"
      aria-label={portfolio.projects.section_label}
    >
      <SectionHeading
        label={portfolio.projects.section_label}
        index={index}
        numbered={portfolio.ui.section_numbering}
      />
      <div className="project-list">
        {getSelectedProjects(portfolio).map((project, projectIndex) => {
          const links = getProjectLinks(project);
          const hasEvidence = Boolean(
            project.media?.hero ||
            project.media?.thumbnail ||
            project.media?.architecture_diagram ||
            project.architecture?.diagram ||
            project.architecture?.components.length ||
            project.results.length,
          );
          return (
            <article
              id={`project-${project.slug}`}
              key={project.slug}
              className="selected-project"
              aria-labelledby={`title-${project.slug}`}
            >
              <header className="project-heading">
                <span
                  className="label text-muted project-number"
                  aria-hidden="true"
                >
                  {String(projectIndex + 1).padStart(2, "0")}
                </span>
                <h3 id={`title-${project.slug}`} className="project-title">
                  {project.title}
                </h3>
                {project.year && (
                  <span className="label text-muted project-year">
                    {project.year}
                  </span>
                )}
              </header>
              <div
                className={`project-composition${hasEvidence ? "" : " without-evidence"}`}
              >
                <div className="project-copy stack">
                  <p className="body-large">{project.one_liner}</p>
                  <p className="body text-muted">{project.summary}</p>
                  {project.domains.length > 0 && (
                    <ul className="project-domains" aria-label="Domains">
                      {project.domains.map((domain) => (
                        <li key={domain}>{domain}</li>
                      ))}
                    </ul>
                  )}
                  {project.technologies.length > 0 && (
                    <div className="project-technologies">
                      <p className="label text-muted">Built with</p>
                      <ul aria-label="Technologies">
                        {project.technologies.map((technology) => (
                          <li key={technology}>{technology}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <Link
                    className="text-link label"
                    href={`/work/${project.slug}`}
                  >
                    View case study <span aria-hidden="true">↗</span>
                    <span className="sr-only"> for {project.title}</span>
                  </Link>
                  {links.length > 0 && (
                    <div className="project-links">
                      {links.map((link) => (
                        <a
                          className="text-link label"
                          key={link.url}
                          href={link.url}
                        >
                          {link.label} <span aria-hidden="true">↗</span>
                          <span className="sr-only"> for {project.title}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                {hasEvidence && (
                  <div className="project-evidence">
                    <ProjectVisual project={project} />
                    {project.results.length > 0 && (
                      <dl className="project-results">
                        {project.results.map((result) => (
                          <div key={result.label}>
                            <dt className="label text-muted">{result.label}</dt>
                            <dd className="result-value">{result.value}</dd>
                            {result.context && (
                              <dd className="result-context text-muted">
                                {result.context}
                              </dd>
                            )}
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
