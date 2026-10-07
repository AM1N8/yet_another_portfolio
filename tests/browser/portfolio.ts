import { execFileSync } from "node:child_process";
import type { Portfolio } from "../../lib/content/types";

export const portfolio: Portfolio = JSON.parse(
  execFileSync(
    process.execPath,
    [
      "--conditions=react-server",
      "--input-type=module",
      "--eval",
      "import { loadPortfolio } from './lib/content/loadPortfolio.ts'; process.stdout.write(JSON.stringify(loadPortfolio()));",
    ],
    { encoding: "utf8" },
  ),
);
