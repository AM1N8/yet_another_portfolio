import { expect, test, type Locator } from "@playwright/test";
import { GalleryPage } from "./GalleryPage";

const viewports = [
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
];
const themes = ["ink", "paper", "catppuccin", "tokyonight", "ayu", "gruvbox"];

async function expectSeparated(viewer: Locator) {
  await expect
    .poll(() =>
      viewer.evaluate((dialog) => {
        const header = dialog.querySelector<HTMLElement>(".artifact-toolbar")!;
        const content = dialog.querySelector<HTMLElement>(".artifact-content")!;
        const outer = dialog.getBoundingClientRect();
        const top = header.getBoundingClientRect();
        const body = content.getBoundingClientRect();
        return (
          body.top >= top.bottom - 1 &&
          body.bottom <= outer.bottom &&
          top.top >= outer.top &&
          dialog.scrollTop === 0 &&
          getComputedStyle(dialog).overflowY === "hidden" &&
          getComputedStyle(content).overflowY === "auto" &&
          content.scrollWidth <= content.clientWidth &&
          getComputedStyle(content).transform === "none"
        );
      }),
    )
    .toBe(true);
}

for (const theme of themes)
  for (const viewport of viewports) {
    test(`viewer separation ${theme} ${viewport.width}×${viewport.height}`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.addInitScript(() =>
        localStorage.setItem("portfolio-theme", "ink"),
      );
      const gallery = new GalleryPage(page);
      await gallery.goto("?item=sand-simulation");
      await expect(gallery.viewer).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      // Exercise a live theme change without remounting or closing the viewer.
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme;
        document.documentElement.dataset.themePreference = theme;
        window.dispatchEvent(new Event("portfolio-theme-change"));
      }, theme);
      await expectSeparated(gallery.viewer);
      const content = gallery.viewer.locator(".artifact-content");
      const heading = gallery.viewer.getByRole("heading");
      await expect(heading).toBeInViewport({ ratio: 1 });
      expect(await content.evaluate((element) => element.scrollTop)).toBe(0);
      const header = gallery.viewer.locator(".artifact-toolbar");
      expect(
        await header.evaluate((element) => {
          const color = getComputedStyle(element).backgroundColor;
          return color === getComputedStyle(document.body).backgroundColor;
        }),
      ).toBe(true);
      await expect
        .poll(() =>
          gallery.viewer
            .getByRole("img")
            .evaluate((image: HTMLImageElement) =>
              image.complete ? image.naturalWidth : 0,
            ),
        )
        .toBeGreaterThan(0);
      await page.screenshot({ path: testInfo.outputPath("opened.png") });
      const initialHeader = await header.boundingBox();
      await content.evaluate((element) => {
        element.scrollTop = element.scrollHeight;
      });
      // Tall/narrow viewports can fit this entire artifact without scrolling.
      await expect
        .poll(() =>
          content.evaluate(
            (element) =>
              Math.abs(
                element.scrollTop -
                  (element.scrollHeight - element.clientHeight),
              ) < 1,
          ),
        )
        .toBe(true);
      if (viewport.width >= 1024)
        expect(
          await content.evaluate((element) => element.scrollTop),
        ).toBeGreaterThan(0);
      await expectSeparated(gallery.viewer);
      expect(await header.boundingBox()).toEqual(initialHeader);
      await expect(
        gallery.viewer.getByRole("button", { name: "NEXT" }),
      ).toBeInViewport();
      await page.screenshot({ path: testInfo.outputPath("scrolled.png") });
      await page.keyboard.press("ArrowRight");
      await expect(content).toHaveJSProperty("scrollTop", 0);
      await expect(gallery.viewer.getByRole("heading")).toBeInViewport({
        ratio: 1,
      });
      await page.keyboard.press("ArrowLeft");
      await expect(
        gallery.viewer.getByRole("heading", { name: /Sand simulation/ }),
      ).toBeVisible();
      await expectSeparated(gallery.viewer);
    });
  }

test("reopening, portrait media and resizing preserve separate scrolling and gallery position", async ({
  page,
}) => {
  const gallery = new GalleryPage(page);
  await gallery.goto();
  await gallery.open("DataTUI — outlier detection");
  await expectSeparated(gallery.viewer);
  await page.keyboard.press("Escape");
  const trigger = page.getByRole("link", {
    name: "View Sand simulation — particle sandbox",
    exact: true,
  });
  await trigger.scrollIntoViewIfNeeded();
  const scrollPosition = await page.evaluate(() => scrollY);
  await trigger.click();
  await expect(gallery.viewer).toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe(
    "hidden",
  );
  await gallery.viewer.locator(".artifact-content").evaluate((element) => {
    element.scrollTop = 300;
  });
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBe(scrollPosition);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
    "hidden",
  );
  await gallery.goto("?item=chest-detection");
  await expect(gallery.viewer).toBeVisible();
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await expectSeparated(gallery.viewer);
    await gallery.viewer.locator(".artifact-content").evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(
      gallery.viewer.getByRole("button", { name: "NEXT" }),
    ).toBeInViewport();
  }
  await page.keyboard.press("ArrowLeft");
  await expect(gallery.viewer.locator(".artifact-content")).toHaveJSProperty(
    "scrollTop",
    0,
  );
  await expect(gallery.viewer.getByRole("heading")).toBeInViewport({
    ratio: 1,
  });
});
