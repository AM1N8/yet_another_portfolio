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
  const resume = page.locator("#home").getByRole("link", { name: /^Resume/ });
  await expect(resume).toHaveAttribute("href", portfolio.contact.resume.url!);
  await expect(resume).toHaveAttribute("target", "_blank");
  const pdf = await page.request.get(portfolio.contact.resume.url!);
  expect(pdf.ok()).toBeTruthy();
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
  expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
  await expect(page.getByRole("link", { name: /^Run/ })).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Currently exploring", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Languages", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator("canvas")).toHaveCount(1);
  for (const link of await page.getByRole("link").all()) {
    const href = await link.getAttribute("href");
    if (href?.includes("#") && !href.startsWith("http")) {
      await expect(page.locator(`#${href.split("#")[1]}`)).toHaveCount(1);
    }
    if (href?.startsWith("/work/")) {
      expect(
        portfolio.projects.entries.some(
          (project) => project.visible && href === `/work/${project.slug}`,
        ),
      ).toBeTruthy();
    }
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
  await page.getByRole("link", { name: "Explore", exact: true }).click();
  await expect(page).toHaveURL(/#work$/);
  await expect(
    page.getByRole("heading", {
      name: portfolio.projects.section_label,
      exact: true,
    }),
  ).toBeInViewport();
  await context.close();
});

test("navigation highlight follows manual scrolling in both directions", async ({
  page,
}) => {
  await page.goto("/");
  const navigation = page.getByRole("navigation", {
    name: "Primary",
    exact: true,
  });
  const expectActive = async (label: string) => {
    await expect(navigation.locator("a[aria-current]")).toHaveCount(1);
    await expect(
      navigation.getByRole("link", { name: label, exact: true }),
    ).toHaveAttribute("aria-current", /page|location/);
  };
  await expectActive("HOME");
  for (const id of [
    "work",
    "lab",
    "timeline",
    "about",
    "contact",
    "about",
    "lab",
    "work",
    "home",
  ]) {
    await page
      .locator(`#${id}`)
      .evaluate((section) => section.scrollIntoView({ block: "start" }));
    await expectActive(id.toUpperCase());
  }
  // Unlisted content inherits the preceding navigation section.
  await page
    .locator("#stack")
    .evaluate((section) => section.scrollIntoView({ block: "start" }));
  await expectActive("ABOUT");
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await expectActive("CONTACT");
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
});

test("navigation highlight supports deep links, mobile and project pages", async ({
  page,
}) => {
  await page.goto("/#timeline");
  const primary = page.getByRole("navigation", {
    name: "Primary",
    exact: true,
  });
  await expect(
    primary.getByRole("link", { name: "TIMELINE", exact: true }),
  ).toHaveAttribute("aria-current", "location");
  await primary.getByRole("link", { name: "WORK", exact: true }).click();
  await expect(
    primary.getByRole("link", { name: "WORK", exact: true }),
  ).toHaveAttribute("aria-current", "location");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel("Navigation menu", { exact: true }).click();
  await page
    .locator("#about")
    .evaluate((section) => section.scrollIntoView({ block: "start" }));
  const mobile = page.getByRole("navigation", { name: "Mobile", exact: true });
  await expect(
    mobile.getByRole("link", { name: "ABOUT", exact: true }),
  ).toHaveAttribute("aria-current", "location");
  await mobile.getByRole("link", { name: "CONTACT", exact: true }).click();
  // The disclosure closes after navigation, so inspect its hidden link by href.
  await expect(page.locator('details a[href="/#contact"]')).toHaveAttribute(
    "aria-current",
    "location",
  );
  await page.goto("/work/noor-alerts");
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(
    primary.getByRole("link", { name: "WORK", exact: true }),
  ).toHaveAttribute("aria-current", "location");
  await expect(
    primary.getByRole("link", { name: "HOME", exact: true }),
  ).not.toHaveAttribute("aria-current");
  await primary.getByRole("link", { name: "HOME", exact: true }).click();
  await expect(
    primary.getByRole("link", { name: "HOME", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});
