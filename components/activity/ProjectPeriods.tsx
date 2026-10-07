import { scaleUtc } from "d3-scale";
import type { ActivityModel } from "@/lib/activity/model";

function boundary(value: string, end: boolean) {
  if (value.length === 4)
    return new Date(`${value}-${end ? "12-31" : "01-01"}T00:00:00Z`);
  if (value.length === 7) {
    const start = new Date(`${value}-01T00:00:00Z`);
    return end
      ? new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0))
      : start;
  }
  return new Date(value);
}

export function ProjectPeriods({
  model,
  year,
}: {
  model: ActivityModel;
  year: string;
}) {
  const periods = model.data.timeline.filter(
    (period) =>
      period.kind === "project" &&
      period.start &&
      (year === "all" ||
        (Number(period.start.slice(0, 4)) <= Number(year) &&
          Number((period.end ?? period.start).slice(0, 4)) >= Number(year))),
  );
  if (!periods.length) return null;
  const starts = periods.map((period) =>
    boundary(period.start!, false).getTime(),
  );
  const ends = periods.map((period) =>
    boundary(period.end ?? period.start!, true).getTime(),
  );
  const x = scaleUtc()
    .domain([new Date(Math.min(...starts)), new Date(Math.max(...ends))])
    .range([1, 99]);
  return (
    <div className="activity-periods">
      <h3 className="label">Project periods · supplied date precision</h3>
      {periods.map((period, index) => {
        const project = model.projects.find((entry) =>
          period.projectSlugs.includes(entry.slug),
        );
        return (
          <div key={period.id}>
            {project && <a href={`/work/${project.slug}`}>{project.title} ↗</a>}
            <span className="mono text-muted">
              {period.start}
              {period.end && period.end !== period.start
                ? ` — ${period.end}`
                : ""}
            </span>
            <svg
              viewBox="0 0 100 8"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <line
                x1={x(starts[index])}
                x2={x(ends[index])}
                y1="4"
                y2="4"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        );
      })}
    </div>
  );
}
