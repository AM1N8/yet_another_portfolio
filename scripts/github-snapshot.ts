import "server-only";

import { writeFile } from "node:fs/promises";
import { loadPortfolio } from "../lib/content/loadPortfolio.ts";
import { fetchGitHubSnapshot } from "../lib/github/fetch.ts";
import { getSnapshotPath } from "../lib/github/loadGitHubData.ts";

const config = loadPortfolio().activity_graph;
if (!config.github_username)
  throw new Error("A GitHub username is required for snapshot generation");
const token =
  config.github_token_env && !config.github_token_env.startsWith("NEXT_PUBLIC_")
    ? process.env[config.github_token_env]
    : undefined;
// Write only after a complete successful fetch so failures preserve the previous snapshot.
const snapshot = await fetchGitHubSnapshot(config.github_username, token);
await writeFile(
  getSnapshotPath(config.fallback.static_data_path),
  `${JSON.stringify(snapshot, null, 2)}\n`,
);
