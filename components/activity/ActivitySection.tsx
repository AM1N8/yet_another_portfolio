import type { Portfolio } from "@/lib/content/types";
import type { GitHubData } from "@/lib/github/types";
import { createActivityModel } from "@/lib/activity/model";
import { SectionHeading } from "@/components/home/SectionHeading";
import { ActivityUniverse } from "./ActivityUniverse";
import { ActivityText } from "./ActivityText";
import "./activity.css";

export function ActivitySection({
  portfolio,
  index,
  data,
}: {
  portfolio: Portfolio;
  index: number;
  data: GitHubData;
}) {
  const model = createActivityModel(data, portfolio);
  return (
    <section
      id="activity"
      className="home-section"
      aria-label="Activity Universe"
    >
      <SectionHeading
        label="ACTIVITY UNIVERSE"
        index={index}
        numbered={portfolio.ui.section_numbering}
      />
      <div className="activity-provenance mono text-muted">
        <span>{data.username && `@${data.username}`}</span>
        {data.capturedAt && (
          <span>Snapshot / {data.capturedAt.slice(0, 10)}</span>
        )}
        <span>
          {data.coverage.contributionCalendar
            ? "Contribution calendar + public events"
            : "Public events only · not a complete contribution history"}
        </span>
        {(data.coverage.eventFeedTruncated ||
          data.coverage.repositoryListTruncated) && (
          <span>API coverage is limited</span>
        )}
      </div>
      <ActivityUniverse model={model}>
        <ActivityText model={model} />
      </ActivityUniverse>
    </section>
  );
}
