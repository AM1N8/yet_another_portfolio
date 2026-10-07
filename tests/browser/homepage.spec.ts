import { test, expect } from "@playwright/test";
import { ShellPage } from "./ShellPage";
import { execFileSync } from "node:child_process";
import type { Portfolio } from "../../lib/content/types";

const portfolio: Portfolio = JSON.parse(
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

test("homepage renders verified YAML content and omits missing or private fields", async ({
  page,
}) => {
  // The native test runner uses the server-only loader; browser expectations
  // are derived from the same validated object rather than copied biography.
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: portfolio.identity.full_name }),
  ).toBeVisible();
  const work = page.getByRole("region", {
    name: portfolio.projects.section_label,
  });
  const titles = portfolio.projects.entries
    .filter((entry) => entry.visible && entry.featured)
    .sort(
      (a, b) => (a.featured_order ?? Infinity) - (b.featured_order ?? Infinity),
    )
    .slice(0, portfolio.homepage.selected_project_count)
    .map((entry) => entry.title);
  await expect(work.getByRole("heading", { level: 3 })).toHaveText(titles);
  await expect(work.getByText("95%", { exact: true })).toBeVisible();
  await expect(work.getByText("5th Place", { exact: true })).toBeVisible();
  await expect(
    page.getByText(portfolio.contact.phone!, { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Résumé", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("link", { name: /^Run/ })).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Currently exploring", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Languages", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator("canvas")).toHaveCount(0);
  for (const link of await page.getByRole("link").all()) {
    const href = await link.getAttribute("href");
    if (href?.includes("#") && !href.startsWith("http")) {
      await expect(page.locator(`#${href.split("#")[1]}`)).toHaveCount(1);
    }
    expect(href).not.toMatch(/^\/work\//);
  }
});

test("desktop, mobile and command navigation reach real homepage sections", async ({
  page,
}) => {
  const shell = new ShellPage(page);
  await shell.goto();
  await page
    .getByRole("navigation", { name: "Primary", exact: true })
    .getByRole("link", { name: "WORK" })
    .click();
  await expect(page).toHaveURL(/#work$/);
  await shell.open();
  await shell.run("ABOUT");
  await expect(page).toHaveURL(/#about$/);
  await expect(
    page.getByRole("heading", { name: "ABOUT", exact: true }),
  ).toBeInViewport();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => scrollTo(0, 0));
  await page.getByLabel("Navigation menu", { exact: true }).click();
  await page
    .getByRole("navigation", { name: "Mobile", exact: true })
    .getByRole("link", { name: "CONTACT" })
    .click();
  await expect(page).toHaveURL(/#contact$/);
  await expect(
    page.getByRole("heading", { name: "Let's talk" }),
  ).toBeInViewport();
  await expect(
    page.getByRole("navigation", { name: "Mobile", exact: true }),
  ).not.toBeVisible();
});

test("all static homepage sections remain readable with JavaScript disabled", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3100");
  await expect(
    page.getByRole("heading", { level: 1, name: portfolio.identity.full_name }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 2 })).toHaveText([
    portfolio.projects.section_label,
    portfolio.experiments.section_label,
    portfolio.timeline.section_label,
    portfolio.about.section_label,
    portfolio.skills.section_label,
    portfolio.contact.contact_cta + "↗",
  ]);
  await page.getByRole("link", { name: "Explore" }).click();
  await expect(page).toHaveURL(/#work$/);
  await expect(
    page.getByRole("heading", {
      name: portfolio.projects.section_label,
      exact: true,
    }),
  ).toBeInViewport();
  await context.close();
});
