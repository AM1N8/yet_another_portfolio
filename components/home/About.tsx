import type { Portfolio } from "@/lib/content/types";
import { SectionHeading } from "./SectionHeading";
import { TechnologyIcon } from "./TechnologyIcon";

export function About({
  portfolio,
  index,
}: {
  portfolio: Portfolio;
  index: number;
}) {
  const { about, identity } = portfolio;
  const lists = [
    { label: "Focus", items: about.interests },
    { label: "Currently exploring", items: about.currently_exploring },
    { label: "Outside engineering", items: about.outside_engineering },
    { label: "Languages", items: identity.languages },
  ].filter((list) => list.items.length > 0);
  return (
    <section
      id="about"
      className="home-section about-section"
      aria-label={about.section_label}
    >
      <SectionHeading
        label={about.section_label}
        index={index}
        numbered={portfolio.ui.section_numbering}
      />
      <div className="about-composition">
        <div className="about-copy stack">
          <p className="body-large">{about.intro}</p>
          {about.philosophy?.trim() && (
            <div className="about-philosophy">
              <h3 className="label text-muted">Approach</h3>
              <p className="body">{about.philosophy}</p>
            </div>
          )}
        </div>
        <div className="about-context stack">
          {lists.map((list) => (
            <div key={list.label}>
              <h3 className="label text-muted">{list.label}</h3>
              <ul>
                {list.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
          {identity.location.show_on_site && (
            <div>
              <h3 className="label text-muted">Location</h3>
              <p>{identity.location.display}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function Stack({
  portfolio,
  index,
}: {
  portfolio: Portfolio;
  index: number;
}) {
  return (
    <section
      id="stack"
      className="home-section stack-section"
      aria-label={portfolio.skills.section_label}
    >
      <SectionHeading
        label={portfolio.skills.section_label}
        index={index}
        numbered={portfolio.ui.section_numbering}
      />
      <div className="skill-groups">
        {portfolio.skills.groups
          .filter((group) => group.items.length > 0)
          .map((group) => (
            <div className="skill-group" key={group.name}>
              <h3 className="label text-muted">{group.name}</h3>
              <ul>
                {group.items.map((item) => (
                  <li key={item}>
                    <TechnologyIcon name={item} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>
    </section>
  );
}
