import type { Portfolio } from "@/lib/content/types";
import { getTimelineEvents } from "@/lib/homepage";
import { SectionHeading } from "./SectionHeading";

export function Timeline({
  portfolio,
  index,
}: {
  portfolio: Portfolio;
  index: number;
}) {
  const events = getTimelineEvents(portfolio);
  const years = [...new Set(events.map((event) => event.year))];
  return (
    <section
      id="timeline"
      className="home-section timeline-section"
      aria-label={portfolio.timeline.section_label}
    >
      <SectionHeading
        label={portfolio.timeline.section_label}
        index={index}
        numbered={portfolio.ui.section_numbering}
      />
      <ol className="timeline-years">
        {years.map((year) => (
          <li className="timeline-year-group" key={year}>
            <time className="timeline-year mono" dateTime={String(year)}>
              {year}
            </time>
            <ol className="timeline-events">
              {events
                .filter((event) => event.year === year)
                .map((event) => (
                  <li
                    className={`timeline-event${event.highlighted ? " is-significant" : ""}`}
                    key={`${event.date}-${event.title}`}
                  >
                    <div className="timeline-event-meta label text-muted">
                      <span>{event.type}</span>
                      {event.highlighted && <span>Milestone</span>}
                      {event.date !== String(year) && (
                        <time dateTime={event.date}>{event.date}</time>
                      )}
                    </div>
                    <h3>
                      {event.link ? (
                        <a href={event.link}>
                          {event.title} <span aria-hidden="true">↗</span>
                        </a>
                      ) : (
                        event.title
                      )}
                    </h3>
                    {event.subtitle && (
                      <p className="timeline-subtitle">{event.subtitle}</p>
                    )}
                    {event.description && (
                      <p className="body text-muted">{event.description}</p>
                    )}
                  </li>
                ))}
            </ol>
          </li>
        ))}
      </ol>
    </section>
  );
}
