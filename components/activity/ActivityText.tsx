import type { ActivityModel } from "@/lib/activity/model";
import { nodeDescription } from "@/lib/activity/model";

export function ActivityText({ model }: { model: ActivityModel }) {
  const { data, projects } = model;
  return (
    <details className="activity-text">
      <summary>Explore activity as text</summary>
      <p className="text-muted">
        Complete records, including nodes omitted from the responsive Canvas.
        Public events and contribution counts describe different measures and
        must not be added together.
      </p>
      {data.nodes.length > 0 ? (
        <ol className="activity-records" aria-label="Activity records">
          {data.nodes.map((node) => (
            <li key={node.id}>
              <span>{nodeDescription(node, data)}</span>
              {projects
                .filter((project) => node.projectSlugs.includes(project.slug))
                .map((project) => (
                  <a key={project.slug} href={`/work/${project.slug}`}>
                    {project.title} ↗
                  </a>
                ))}
            </li>
          ))}
        </ol>
      ) : (
        <p>No activity records are available in this dataset.</p>
      )}
      {data.languages.length > 0 && (
        <>
          <h3>Repository language distribution</h3>
          <p className="text-muted">
            Share of observed repository bytes, not a measure of proficiency or
            time spent.
          </p>
          <ul>
            {data.languages.map((language) => (
              <li key={language.language}>
                {language.language} · {language.bytes.toLocaleString("en-US")}{" "}
                bytes · {(language.share * 100).toFixed(1)}%
              </li>
            ))}
          </ul>
        </>
      )}
      {data.timeline.length > 0 && (
        <>
          <h3>Recorded periods</h3>
          <ul>
            {data.timeline.map((period) => (
              <li key={period.id}>
                {period.kind === "project"
                  ? projects.find((project) =>
                      period.projectSlugs.includes(project.slug),
                    )?.title
                  : period.repository}{" "}
                · {period.start ?? "Start unrecorded"}
                {period.end && period.end !== period.start
                  ? ` — ${period.end}`
                  : ""}
                {period.kind === "repository" &&
                  " · repository created / last pushed"}
              </li>
            ))}
          </ul>
        </>
      )}
      {projects.length > 0 && (
        <nav aria-label="Activity project case studies">
          <h3>Associated projects</h3>
          <ul>
            {projects.map((project) => (
              <li key={project.slug}>
                <a href={`/work/${project.slug}`}>{project.title} ↗</a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </details>
  );
}
