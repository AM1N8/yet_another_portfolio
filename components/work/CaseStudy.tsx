import Link from "next/link";
import type { Project } from "@/lib/content/types";
import { getProjectLinks, getProjectSections } from "@/lib/projects";
import { ArchitectureDiagram } from "./ArchitectureDiagram";
import { ProjectImage } from "./ProjectMedia";

export function CaseStudy({ project }: { project: Project }) {
  const links = getProjectLinks(project);
  const sections = getProjectSections(project);
  const diagram =
    project.architecture?.diagram || project.media?.architecture_diagram;
  const hasArchitecture = Boolean(
    project.architecture?.summary?.trim() ||
    project.architecture?.components.length ||
    diagram,
  );
  const hero = project.media?.hero;
  const gallery = [
    ...new Set([project.media?.thumbnail, ...(project.media?.gallery ?? [])]),
  ].filter((src): src is string =>
    Boolean(src && src !== hero && src !== diagram),
  );
  const metadata = [
    { label: "Status", value: project.status },
    { label: "Year", value: project.year?.toString() },
    { label: "Role", value: project.role },
    { label: "Team size", value: project.team_size?.toString() },
    {
      label: "Period",
      value:
        project.dates?.label ||
        [project.dates?.start, project.dates?.end].filter(Boolean).join(" — "),
    },
  ].filter((item) => item.value?.trim());
  return (
    <article className="case-study">
      <Link href="/#work" className="case-link label">
        ← Selected work
      </Link>
      <header className="case-header">
        <p className="label text-muted">Project / Case study</p>
        <h1>{project.title}</h1>
        <p className="case-purpose body-large">{project.one_liner}</p>
        <dl className="case-metadata">
          {metadata.map((item) => (
            <div key={item.label}>
              <dt className="label text-muted">{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
        {project.domains.length > 0 && (
          <ul className="case-domains" aria-label="Domains">
            {project.domains.map((domain) => (
              <li key={domain}>{domain}</li>
            ))}
          </ul>
        )}
        {links.length > 0 && (
          <nav className="case-links" aria-label="Project links">
            {links.map((link) => (
              <a
                className="case-link label"
                href={link.url}
                key={`${link.label}-${link.url}`}
              >
                {link.label} <span aria-hidden="true">↗</span>
              </a>
            ))}
          </nav>
        )}
      </header>
      {hero && (
        <ProjectImage
          src={hero}
          alt={`${project.title} — ${project.one_liner}`}
          priority
        />
      )}
      <section className="case-section" aria-labelledby="overview">
        <h2 id="overview">Overview</h2>
        <div className="case-prose">
          <p>{project.summary}</p>
        </div>
      </section>
      {sections
        .filter((section) => !["lessons", "next-steps"].includes(section.id))
        .map((section) => (
          <section
            className="case-section"
            key={section.id}
            aria-labelledby={section.id}
          >
            <h2 id={section.id}>{section.title}</h2>
            <div className="case-prose">
              {section.text && <p>{section.text}</p>}
              {section.items && (
                <ul>
                  {section.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}
      {hasArchitecture && (
        <section className="case-section" aria-labelledby="architecture">
          <h2 id="architecture">Architecture</h2>
          <div className="case-prose">
            {project.architecture?.summary?.trim() && (
              <p>{project.architecture.summary}</p>
            )}
            {diagram ? (
              <ProjectImage
                src={diagram}
                alt={`${project.title} system architecture`}
              />
            ) : (
              <ArchitectureDiagram
                components={project.architecture?.components ?? []}
              />
            )}
          </div>
        </section>
      )}
      {project.results.length > 0 && (
        <section className="case-section" aria-labelledby="results">
          <h2 id="results">Results</h2>
          <dl className="case-results">
            {project.results.map((result) => (
              <div key={result.label}>
                <dt className="label text-muted">{result.label}</dt>
                <dd className="case-result-value">{result.value}</dd>
                {result.context?.trim() && (
                  <dd className="text-muted">{result.context}</dd>
                )}
              </div>
            ))}
          </dl>
        </section>
      )}
      {sections
        .filter((section) => ["lessons", "next-steps"].includes(section.id))
        .map((section) => (
          <section
            className="case-section"
            key={section.id}
            aria-labelledby={section.id}
          >
            <h2 id={section.id}>{section.title}</h2>
            <div className="case-prose">
              <p>{section.text}</p>
            </div>
          </section>
        ))}
      {project.technologies.length > 0 && (
        <section className="case-section" aria-labelledby="stack">
          <h2 id="stack">Stack</h2>
          <ul className="case-stack">
            {project.technologies.map((technology) => (
              <li key={technology}>{technology}</li>
            ))}
          </ul>
        </section>
      )}
      {(gallery.length > 0 || project.media?.demo_video) && (
        <section className="case-section" aria-labelledby="media">
          <h2 id="media">Media</h2>
          <div className="case-gallery">
            {gallery.map((src, index) => (
              <ProjectImage
                key={src}
                src={src}
                alt={`${project.title} — project visual ${index + 1}`}
              />
            ))}
            {project.media?.demo_video && (
              <video
                controls
                preload="none"
                poster={hero || project.media.thumbnail || undefined}
                aria-label={`${project.title} demonstration`}
              >
                <source src={project.media.demo_video} />
                <a href={project.media.demo_video}>View project video</a>
              </video>
            )}
          </div>
        </section>
      )}
      <footer className="case-footer">
        <Link href="/#work" className="case-link label">
          ← Back to selected work
        </Link>
      </footer>
    </article>
  );
}
