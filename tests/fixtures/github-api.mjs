// Test-only server API transport. Its build and fetch cache use .next-browser.
// No synthetic observations are written to the portfolio or public snapshot.
import { execFileSync } from "node:child_process";

const originalFetch = globalThis.fetch;
let portfolio;
function content() {
  portfolio ??= JSON.parse(
    execFileSync(
      process.execPath,
      [
        "--conditions=react-server",
        "--input-type=module",
        "--eval",
        "import { loadPortfolio } from './lib/content/loadPortfolio.ts'; process.stdout.write(JSON.stringify(loadPortfolio()));",
      ],
      { encoding: "utf8", env: { ...process.env, NODE_OPTIONS: "" } },
    ),
  );
  return portfolio;
}
globalThis.fetch = async (input, init) => {
  const url = String(input instanceof Request ? input.url : input);
  if (!url.startsWith("https://api.github.com/"))
    return originalFetch(input, init);
  if (process.env.ACTIVITY_TEST_EMPTY === "1")
    return new Response(null, { status: 503 });
  const source = content();
  const names = source.projects.entries
    .filter(
      (project) =>
        project.visible &&
        project.activity?.include_in_activity_graph &&
        project.activity.github_repo,
    )
    .map((project) => project.activity.github_repo);
  names.push(`${source.activity_graph.github_username}/fixture-unmapped`);
  const json = (value) =>
    new Response(JSON.stringify(value), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  if (url.includes("/languages")) return json({ TypeScript: 60, Python: 40 });
  if (url.includes("/events/public")) {
    const page = Number(new URL(url).searchParams.get("page"));
    const events = Array.from({ length: 160 }, (_, index) => ({
      id: `fixture-${index}`,
      type: index % 2 ? "PushEvent" : "IssuesEvent",
      public: true,
      created_at: new Date(
        Date.UTC(index < 140 ? 2026 : 2025, 0, 1 + (index % 90)),
      ).toISOString(),
      repo: { name: names[index % names.length] },
    }));
    return json(events.slice((page - 1) * 100, page * 100));
  }
  return json(
    names.map((name, index) => ({
      full_name: name,
      html_url: `https://github.com/${name}`,
      description: null,
      language:
        index === names.length - 1 ? null : index % 2 ? "Python" : "TypeScript",
      created_at: "2025-01-01T00:00:00Z",
      pushed_at: "2026-03-01T00:00:00Z",
      archived: false,
      fork: false,
      private: false,
    })),
  );
};
