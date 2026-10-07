import Image from "next/image";
import type { Portfolio } from "@/lib/content/types";
import { getExperiments } from "@/lib/homepage";
import { SectionHeading } from "./SectionHeading";

export function Lab({
  portfolio,
  index,
}: {
  portfolio: Portfolio;
  index: number;
}) {
  return (
    <section
      id="lab"
      className="home-section lab-section"
      aria-label={portfolio.experiments.section_label}
    >
      <SectionHeading
        label={portfolio.experiments.section_label}
        index={index}
        numbered={portfolio.ui.section_numbering}
      />
      <div className="experiment-list">
        {getExperiments(portfolio).map((experiment) => (
          <article
            className="experiment"
            key={experiment.slug}
            aria-labelledby={`experiment-${experiment.slug}`}
          >
            <div className="experiment-meta label">
              <span>{experiment.code}</span>
              <span className="text-muted">{experiment.status}</span>
            </div>
            <h3 id={`experiment-${experiment.slug}`}>{experiment.title}</h3>
            <p className="experiment-domain text-muted">{experiment.domain}</p>
            {experiment.preview && (
              <div className="experiment-image">
                <Image
                  src={experiment.preview}
                  alt={`${experiment.title} preview`}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  unoptimized={experiment.preview.startsWith("http")}
                />
              </div>
            )}
            <p className="body">{experiment.summary}</p>
            {experiment.technologies.length > 0 && (
              <p className="label text-muted">
                {experiment.technologies.join(" / ")}
              </p>
            )}
            {(experiment.github || experiment.live_demo) && (
              <div className="experiment-links">
                {experiment.github && (
                  <a className="text-link label" href={experiment.github}>
                    Repository <span aria-hidden="true">↗</span>
                    <span className="sr-only"> for {experiment.title}</span>
                  </a>
                )}
                {experiment.live_demo && (
                  <a className="text-link label" href={experiment.live_demo}>
                    Run <span aria-hidden="true">↗</span>
                    <span className="sr-only"> {experiment.title}</span>
                  </a>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
