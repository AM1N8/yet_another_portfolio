import type { Portfolio } from "@/lib/content/types";
import { CdxvMorph } from "@/components/hero/CdxvMorph";

export function Hero({
  portfolio,
  nextSection,
}: {
  portfolio: Portfolio;
  nextSection?: string;
}) {
  const { identity, hero, contact } = portfolio;
  const words = identity.full_name.split(/\s+/);
  const givenName = words.slice(0, -1).join(" ");
  const surname = words[words.length - 1];
  return (
    <section id="home" className="home-hero" aria-labelledby="hero-name">
      <div className="hero-composition">
        <div className="hero-introduction">
          <p className="label text-muted hero-eyebrow">{hero.eyebrow}</p>
          <h1
            id="hero-name"
            className="display hero-name"
            aria-label={identity.full_name}
          >
            {givenName && (
              <span className="hero-given-name" aria-hidden="true">
                {givenName}
              </span>
            )}
            <span aria-hidden="true">{surname}</span>
          </h1>
          <p className="hero-role">{hero.role}</p>
          <p className="body-large hero-statement">{hero.statement}</p>
        </div>
        {hero.show_activity_visual && (
          <CdxvMorph motionEnabled={portfolio.ui.motion.enabled} />
        )}
      </div>
      <div className="hero-bottom">
        {identity.availability.visible && (
          <div className="hero-status">
            <p className="label text-muted">
              <span className="status-dot" aria-hidden="true" />
              {hero.status_label}
            </p>
            <p>{identity.availability.status}</p>
          </div>
        )}
        {identity.location.show_on_site && (
          <div className="hero-location">
            <p className="label text-muted">Location</p>
            <p>{identity.location.display}</p>
          </div>
        )}
        <div className="hero-links">
          {contact.links.github && (
            <a className="text-link label" href={contact.links.github}>
              GitHub <span aria-hidden="true">↗</span>
            </a>
          )}
          {contact.links.linkedin && (
            <a className="text-link label" href={contact.links.linkedin}>
              LinkedIn <span aria-hidden="true">↗</span>
            </a>
          )}
          {contact.email_public && (
            <a className="text-link label" href={`mailto:${contact.email}`}>
              Email <span aria-hidden="true">↗</span>
            </a>
          )}
          {contact.resume.visible && contact.resume.url && (
            <a
              className="text-link label"
              href={contact.resume.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {contact.resume.label} <span aria-hidden="true">↗</span>
              <span className="sr-only"> (PDF, opens in a new tab)</span>
            </a>
          )}
        </div>
      </div>
      {hero.show_scroll_hint && nextSection && (
        <a className="scroll-hint label text-muted" href={`#${nextSection}`}>
          Explore <span aria-hidden="true">↓</span>
        </a>
      )}
    </section>
  );
}
