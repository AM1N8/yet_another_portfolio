import { test, expect } from "@playwright/test";
import { ActivityPage } from "../browser/ActivityPage";

test("API failure displays the honest empty fallback and keeps all modes and project links usable", async ({
  page,
}, testInfo) => {
  const activity = new ActivityPage(page);
  await activity.goto();
  await page.setViewportSize({ width: 390, height: 844 });
  for (const mode of ["ACTIVITY", "PROJECTS", "LANGUAGES", "TIMELINE"]) {
    await activity.mode(mode);
    await expect(
      activity.region.getByText("No activity records available.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(activity.region.getByRole("status")).toContainText(
      "0 of 0 records shown · saved fallback",
    );
  }
  await page.getByText("Explore activity as text", { exact: true }).click();
  await expect(
    activity.region.getByRole("navigation", {
      name: "Activity project case studies",
    }),
  ).toBeVisible();
  await activity.region.screenshot({
    path: testInfo.outputPath("empty-paper.png"),
  });
  await page
    .getByRole("banner")
    .getByRole("button", { name: "Use INK theme" })
    .click();
  await activity.region.screenshot({
    path: testInfo.outputPath("empty-ink.png"),
  });
  await activity.region
    .getByRole("navigation", { name: "Activity project case studies" })
    .getByRole("link")
    .evaluateAll((links) => {
      if (
        !links.every((link) => link.getAttribute("href")?.startsWith("/work/"))
      )
        throw new Error("Invalid project links");
    });
});
