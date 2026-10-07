import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";
import { parseDocument } from "yaml";
import { portfolioSchema } from "./schema.ts";
import type { Portfolio } from "./types.ts";

const contentPath = join(process.cwd(), "content", "portfolio.yaml");

export function parsePortfolioYaml(
  source: string,
  sourceName = "content/portfolio.yaml",
): Portfolio {
  const document = parseDocument(source, { uniqueKeys: true });

  if (document.errors.length > 0) {
    throw new Error(
      `Invalid YAML in ${sourceName}:\n${document.errors.map((error) => `- ${error.message}`).join("\n")}`,
    );
  }

  const result = portfolioSchema.safeParse(
    document.toJS({ maxAliasCount: 100 }),
  );

  if (!result.success) {
    const issues = result.error.issues.map(
      (issue) =>
        `- ${issue.path.map(String).join(".") || "(root)"}: ${issue.message}`,
    );
    throw new Error(
      `Invalid portfolio content in ${sourceName}:\n${issues.join("\n")}`,
    );
  }

  return result.data;
}

// Cache within a server render, rather than keeping stale content across dev requests.
export const loadPortfolio = cache((): Portfolio => {
  let source: string;

  try {
    source = readFileSync(contentPath, "utf8");
  } catch (cause) {
    throw new Error(`Unable to read portfolio content at ${contentPath}`, {
      cause,
    });
  }

  return parsePortfolioYaml(source, contentPath);
});
