import { expect, test } from "@playwright/test";
import { GalleryPage } from "./GalleryPage";
import { TerminalPage } from "./TerminalPage";
import { ShellPage } from "./ShellPage";
import { portfolio } from "./portfolio";
import { getGalleryItems } from "../../lib/gallery";

const artifacts = getGalleryItems(portfolio);

test("combinable filters, tag search, URL restoration, reset and index preview", async ({
  page,
}) => {
  const gallery = new GalleryPage(page);
  await gallery.goto();
  await expect(gallery.entries).toHaveCount(artifacts.length);
  await gallery.filters
    .getByLabel("PROJECT", { exact: true })
    .selectOption("noor-alerts");
  await gallery.filters
    .getByLabel("TYPE", { exact: true })
    .selectOption("architecture");
  await gallery.filters
    .getByLabel("YEAR", { exact: true })
    .selectOption("2026");
  await gallery.filters.getByRole("searchbox").fill("graphRAG SCADA");
  await expect(gallery.entries).toHaveCount(1);
  await expect(page).toHaveURL(/project=noor-alerts/);
  await page.reload();
  await expect(gallery.filters.getByRole("searchbox")).toHaveValue(
    "graphRAG SCADA",
  );
  await expect(gallery.entries).toHaveCount(1);
  await gallery.filters
    .getByLabel("TYPE", { exact: true })
    .selectOption("result");
  await expect(
    page.getByRole("heading", { name: "No matching artifacts." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Clear filters" }).click();
  await expect(gallery.entries).toHaveCount(artifacts.length);
  await expect(page).toHaveURL(/\/gallery$/);
  await page.getByRole("button", { name: "INDEX", exact: true }).click();
  await expect(page).toHaveURL(/view=index/);
  const entry = page.getByRole("link", {
    name: "View Noor Alerts — system components",
    exact: true,
  });
  await entry.focus();
  await expect(entry.getByRole("img")).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "INDEX", pressed: true }),
  ).toBeVisible();
});

test("artifact viewer supports keyboard navigation, focus trapping/restoration and shareable deep links", async ({
  page,
}) => {
  const gallery = new GalleryPage(page);
  await gallery.goto("?type=architecture");
  const trigger = page.getByRole("link", {
    name: "View Noor Alerts — system components",
    exact: true,
  });
  await gallery.open();
  await expect(page).toHaveURL(/item=noor-components/);
  await expect(
    gallery.viewer.getByRole("heading", {
      name: "Noor Alerts — system components",
    }),
  ).toBeVisible();
  await gallery.viewer
    .getByRole("button", { name: "Close artifact viewer" })
    .press("Shift+Tab");
  await expect(
    gallery.viewer.getByRole("button", { name: "NEXT" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    gallery.viewer.getByRole("button", { name: "Close artifact viewer" }),
  ).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(
    gallery.viewer.getByRole("heading", {
      name: "MUSIQ — reinforcement learning components",
    }),
  ).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(
    gallery.viewer.getByRole("heading", {
      name: "Noor Alerts — system components",
    }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(gallery.viewer).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page).toHaveURL(/\/gallery\?type=architecture$/);
  await gallery.goto("?item=trajectory-results&view=index");
  await expect(gallery.viewer).toBeVisible();
  await expect(
    gallery.viewer.getByRole("heading", {
      name: "Trajectory prediction — evaluation results",
    }),
  ).toBeVisible();
  await expect(
    gallery.viewer.getByRole("link", { name: "Project case study" }),
  ).toHaveAttribute("href", "/work/trajectory-prediction");
  await gallery.viewer
    .getByRole("button", { name: "Close artifact viewer" })
    .click();
  await expect(page).toHaveURL(/view=index/);
  await expect(page.locator("#archive-results")).toBeFocused();
});

test("browser Back closes the viewer and missing images have an accessible fallback", async ({
  page,
}) => {
  await page.route("**/gallery/noor-components.svg", (route) => route.abort());
  const gallery = new GalleryPage(page);
  await gallery.goto();
  await expect(
    page.getByText("Image unavailable", { exact: true }),
  ).toBeVisible();
  await gallery.open();
  await expect(
    gallery.viewer.getByText("Image unavailable", { exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(gallery.viewer).not.toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "View Noor Alerts — system components",
      exact: true,
    }),
  ).toBeFocused();
});

test("gallery is server-rendered and filtering works without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const gallery = new GalleryPage(page);
  await page.goto("/gallery?type=result");
  await expect(gallery.entries).toHaveCount(
    artifacts.filter((item) => item.type === "result").length,
  );
  await expect(
    page.getByRole("heading", {
      name: "Trajectory prediction — evaluation results",
    }),
  ).toBeVisible();
  await gallery.filters
    .getByLabel("TYPE", { exact: true })
    .selectOption("architecture");
  await gallery.filters.getByRole("button", { name: "Apply filters" }).click();
  await expect(gallery.entries).toHaveCount(2);
  await context.close();
});

test("normal navigation, command palette and terminal open the archive without adding a homepage section", async ({
  page,
}) => {
  const shell = new ShellPage(page);
  await shell.goto();
  await expect(page.locator("main #gallery")).toHaveCount(0);
  await page
    .getByRole("navigation", { name: "Primary", exact: true })
    .getByRole("link", { name: "GALLERY" })
    .click();
  await expect(
    page.getByRole("heading", { name: "VISUAL ARCHIVE" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Primary", exact: true })
      .getByRole("link", { name: "GALLERY" }),
  ).toHaveAttribute("aria-current", "page");
  await shell.open();
  await shell.run("gallery");
  await expect(page).toHaveURL(/\/gallery$/);
  const terminal = new TerminalPage(page);
  await terminal.open();
  await terminal.command("gallery noor-alerts --type architecture");
  await expect(page).toHaveURL(/project=noor-alerts&type=architecture/);
  await expect(page.locator("[data-artifact]:visible")).toHaveCount(1);
});

for (const theme of ["ink", "paper", "tokyonight"])
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    test(`gallery visual ${theme} ${viewport.width}×${viewport.height}`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.addInitScript(
        (theme) => localStorage.setItem("portfolio-theme", theme),
        theme,
      );
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      const gallery = new GalleryPage(page);
      await gallery.goto();
      await page.evaluate(() => document.fonts.ready);
      for (const image of await gallery.entries.getByRole("img").all()) {
        await image.scrollIntoViewIfNeeded();
        await expect
          .poll(() =>
            image.evaluate((element: HTMLImageElement) =>
              element.complete ? element.naturalWidth : 0,
            ),
          )
          .toBeGreaterThan(0);
      }
      await page.evaluate(() => scrollTo(0, 0));
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
      await page.screenshot({
        path: testInfo.outputPath("grid.png"),
        fullPage: true,
      });
      await page.getByRole("button", { name: "INDEX", exact: true }).click();
      await page.screenshot({
        path: testInfo.outputPath("index.png"),
        fullPage: true,
      });
      await gallery.open();
      await expect(gallery.viewer.getByRole("img")).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath("viewer.png") });
      await page.keyboard.press("ArrowRight");
      await expect(
        gallery.viewer.getByRole("heading", {
          name: "MUSIQ — reinforcement learning components",
        }),
      ).toBeVisible();
      await page.screenshot({
        path: testInfo.outputPath("optional-metadata.png"),
      });
      await page.keyboard.press("Escape");
      await gallery.goto("?item=datatui-cli");
      const screenshot = gallery.viewer.getByRole("img");
      await expect(screenshot).toBeVisible();
      await expect
        .poll(() =>
          screenshot.evaluate((image: HTMLImageElement) =>
            image.complete ? image.naturalWidth : 0,
          ),
        )
        .toBeGreaterThan(0);
      await expect(
        gallery.viewer.getByRole("link", { name: "GitHub" }),
      ).toHaveAttribute("href", "https://github.com/AM1N8/DATATUI");
      await page.screenshot({
        path: testInfo.outputPath("uploaded-image.png"),
      });
      expect(errors).toEqual([]);
    });
  }
