import type { Portfolio } from "@/lib/content/types";

export function Hero({
  portfolio,
  nextSection,
}: {
  portfolio: Portfolio;
  nextSection?: string;
}) {
  const { identity, hero, contact } = portfolio;
  const words = identity.full_name.split(/\s+/);
  const prefix = words.length > 2 ? words.slice(0, -2).join(" ") : null;
  const displayWords = words.slice(-2);
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
            {prefix && (
              <span className="hero-name-prefix" aria-hidden="true">
                {prefix}
              </span>
            )}
            {displayWords.map((word, index) => (
              <span key={`${word}-${index}`} aria-hidden="true">
                {word}
              </span>
            ))}
          </h1>
          <p className="hero-role">{hero.role}</p>
          <p className="body-large hero-statement">{hero.statement}</p>
        </div>
        {hero.show_activity_visual && (
          <figure
            id="activity"
            className="activity-reserve"
            aria-label="Reserved Activity Universe visual area"
          >
            <div className="reserve-heading label">
              <span>Activity Universe</span>
              <span className="text-muted">Reserved</span>
            </div>
            <svg
              viewBox="0 0 400 360"
              className="reserve-field"
              aria-hidden="true"
            >
              <defs>
                <pattern
                  id="reserve-grid"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 H 0 V 40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.6"
                  />
                </pattern>
              </defs>
              <rect
                x="20"
                y="20"
                width="360"
                height="320"
                fill="url(#reserve-grid)"
              />
              <path
                d="M20 32V20H32 M368 20H380V32 M380 328V340H368 M32 340H20V328"
                className="reserve-corners"
                fill="none"
                stroke="currentColor"
              />
              <path
                d="M190 180H210 M200 170V190"
                fill="none"
                stroke="currentColor"
              />
            </svg>
            <figcaption className="reserve-caption">
              {hero.verbs.length > 0 && (
                <p className="label">{hero.verbs.join(" / ")}</p>
              )}
              <p className="text-muted">Static field · no activity data</p>
            </figcaption>
          </figure>
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
