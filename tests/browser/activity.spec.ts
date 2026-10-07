import { test, expect } from "@playwright/test";
import { ActivityPage } from "./ActivityPage";
import { portfolio } from "./portfolio";

test("four modes, years, hover details, keyboard text alternative and project links", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const activity = new ActivityPage(page);
  await activity.goto();
  const point = await activity.nodePoint();
  await page.mouse.move(point.x, point.y);
  await expect(activity.region.getByRole("tooltip")).toContainText("2026-");
  await page.mouse.move(10, 10);
  await expect(activity.region.getByRole("tooltip")).toBeVisible();
  await activity.region
    .getByRole("button", { name: "PROJECTS", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(activity.region.getByRole("status")).toContainText("PROJECTS");
  await expect(activity.region.getByText(/Other repositories ·/)).toBeVisible();
  await activity.mode("LANGUAGES");
  await expect(
    activity.region.getByText(/Language unavailable ·/),
  ).toBeVisible();
  await activity.mode("TIMELINE");
  await expect(
    activity.region.getByRole("heading", {
      name: "Project periods · supplied date precision",
    }),
  ).toBeVisible();
  await activity.mode("ACTIVITY");
  await activity.region
    .getByRole("combobox", { name: "Year", exact: true })
    .selectOption("2025");
  await expect(activity.region.getByRole("status")).toContainText("20 of 20");
  await activity.region
    .getByRole("combobox", { name: "Year", exact: true })
    .selectOption("all");
  await expect(activity.region.getByRole("status")).toContainText("160 of 160");
  const summary = activity.region.getByText("Explore activity as text", {
    exact: true,
  });
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(
    activity.region
      .getByRole("list", { name: "Activity records" })
      .getByRole("listitem"),
  ).toHaveCount(160);
  const project = portfolio.projects.entries.find(
    (entry) => entry.visible && entry.activity?.include_in_activity_graph,
  )!;
  await activity.region
    .getByRole("navigation", { name: "Activity project case studies" })
    .getByRole("link", {
      name: `${project.short_title || project.title} ↗`,
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(`/work/${project.slug}`);
});

test("project cluster labels navigate and repeated animated switching remains stable", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const activity = new ActivityPage(page);
  await activity.goto();
  for (let index = 0; index < 3; index++) {
    for (const mode of ["PROJECTS", "LANGUAGES", "TIMELINE", "ACTIVITY"])
      await activity.mode(mode);
  }
  await activity.mode("PROJECTS");
  const project = portfolio.projects.entries.find(
    (entry) => entry.slug === "noor-alerts",
  )!;
  await activity.region
    .locator(".activity-labels")
    .getByRole("link", {
      name: new RegExp(project.short_title || project.title),
    })
    .click();
  await expect(page).toHaveURL(`/work/${project.slug}`);
  await page.goBack();
  await expect(activity.canvas).toBeVisible();
  expect(errors).toEqual([]);
});

test("DPR, resize, reduced motion, and Canvas failure preserve the alternative", async ({
  browser,
}) => {
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const activity = new ActivityPage(page);
  await activity.goto();
  await expect
    .poll(() =>
      activity.canvas.evaluate(
        (canvas: HTMLCanvasElement) =>
          canvas.width / canvas.getBoundingClientRect().width,
      ),
    )
    .toBe(2);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      activity.canvas.evaluate(
        (canvas: HTMLCanvasElement) =>
          canvas.width === Math.round(canvas.getBoundingClientRect().width * 2),
      ),
    )
    .toBe(true);
  await activity.mode("LANGUAGES");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await context.close();
  const unavailable = await browser.newContext();
  const fallback = await unavailable.newPage();
  await fallback.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await fallback.goto("/#activity");
  await expect(
    fallback.getByText("Canvas is unavailable.", { exact: false }),
  ).toBeVisible();
  await fallback.getByText("Explore activity as text", { exact: true }).click();
  await expect(
    fallback.getByRole("list", { name: "Activity records" }),
  ).toBeVisible();
  await unavailable.close();
});

test("activity records and project navigation work without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/#activity");
  await page.getByText("Explore activity as text", { exact: true }).click();
  await expect(
    page.getByRole("list", { name: "Activity records" }).getByRole("listitem"),
  ).toHaveCount(160);
  await expect(
    page.getByRole("navigation", { name: "Activity project case studies" }),
  ).toBeVisible();
  await context.close();
});

for (const [width, height] of [
  [1920, 1080],
  [1440, 900],
  [768, 1024],
  [430, 932],
  [390, 844],
]) {
  for (const theme of ["paper", "ink"] as const) {
    test(`activity visual ${width}×${height} ${theme}`, async ({
      page,
    }, testInfo) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await page.setViewportSize({ width, height });
      await page.emulateMedia({
        colorScheme: theme === "ink" ? "dark" : "light",
        reducedMotion: "reduce",
      });
      const activity = new ActivityPage(page);
      await activity.goto();
      await page.evaluate(() => document.fonts.ready);
      for (const mode of ["ACTIVITY", "PROJECTS", "LANGUAGES", "TIMELINE"]) {
        await activity.mode(mode);
        await expect(activity.region.getByRole("status")).toContainText(
          "140 of 140",
        );
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await activity.region.screenshot({
          path: testInfo.outputPath(`${mode.toLowerCase()}.png`),
        });
      }
      expect(errors).toEqual([]);
    });
  }
}
