import { test, expect } from "@playwright/test";
import { ShellPage } from "./ShellPage";

test.use({ colorScheme: "light" });

test("theme follows the system, persists explicit choice, and synchronizes both controls", async ({
  page,
}) => {
  const shell = new ShellPage(page);
  await shell.goto();
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "ink");
  await page
    .getByRole("banner")
    .getByRole("button", { name: "Use PAPER theme" })
    .click();
  await expect(
    page.getByRole("button", { name: "Use PAPER theme", pressed: true }),
  ).toHaveCount(2);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "paper");
  await shell.open();
  await shell.run("Use system theme");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "ink");
});

test("saved theme is applied before hydration with no console errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.addInitScript(() =>
    localStorage.setItem("portfolio-theme", "ink"),
  );
  await page.route(/\/_next\/.*\.js(?:\?|$)/, (route) => route.abort());
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "ink");
  await expect(page.getByRole("banner")).toHaveCSS(
    "background-color",
    "rgb(15, 16, 14)",
  );
  await page.unrouteAll();
  // Reload without blocked scripts to check React's initial hydration too.
  errors.length = 0;
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Use INK theme", pressed: true }),
  ).toHaveCount(2);
  expect(errors).toEqual([]);
});

test("palette keyboard search, arrow selection, focus trapping, Escape, and restoration", async ({
  page,
}) => {
  const shell = new ShellPage(page);
  await shell.goto();
  await shell.trigger.focus();
  await page.keyboard.press("Control+k");
  await expect(shell.search).toBeFocused();
  await shell.search.fill("Appearance");
  const selected = await shell.search.getAttribute("aria-activedescendant");
  await shell.search.press("ArrowDown");
  expect(await shell.search.getAttribute("aria-activedescendant")).not.toEqual(
    selected,
  );
  await page.keyboard.press("Tab");
  await expect(
    shell.palette.getByRole("button", { name: "Close command palette" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(shell.search).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(shell.palette).not.toBeVisible();
  await expect(shell.trigger).toBeFocused();
  await page.keyboard.press("Meta+k");
  await expect(shell.palette).toBeVisible();
  await shell.run("Toggle INK");
  await expect(shell.palette).not.toBeVisible();
  await expect(shell.trigger).toBeFocused();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "ink");
});

test("command destinations, unavailable routes, missing resume, clipboard and empty search", async ({
  page,
  context,
}) => {
  const shell = new ShellPage(page);
  await shell.goto();
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await shell.open();
  await expect(
    shell.palette.getByRole("option", { name: "Open Résumé", exact: false }),
  ).toHaveCount(0);
  await shell.search.fill("Projects");
  for (const option of await shell.palette.getByRole("option").all())
    await expect(option).toBeDisabled();
  await shell.run("Copy email");
  await expect(shell.palette.getByRole("status")).toHaveText(
    "Email copied to clipboard.",
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "@",
  );
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error("denied")) },
    });
  });
  await shell.run("Copy email");
  await expect(shell.palette.getByRole("status")).toContainText(
    "Clipboard unavailable. Copy this address:",
  );
  await shell.search.fill("nothing matches this command");
  await expect(shell.palette.getByText("No matching commands.")).toBeVisible();
  await page.keyboard.press("Escape");
  const destination = "https://github.com/AM1N8";
  await page.route(destination, (route) =>
    route.fulfill({
      body: "External destination verified",
      contentType: "text/html",
    }),
  );
  await shell.open();
  await shell.run("Open GitHub");
  await expect(page).toHaveURL(destination);
});

test("mobile disclosure is keyboard accessible, closes on Escape and outside click", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const shell = new ShellPage(page);
  await shell.goto();
  const menu = page.getByLabel("Navigation menu", { exact: true });
  await menu.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("navigation", { name: "Mobile", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(
    page
      .getByRole("navigation", { name: "Mobile", exact: true })
      .getByRole("link", { name: "HOME" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await expect(
    page.getByRole("navigation", { name: "Mobile", exact: true }),
  ).not.toBeVisible();
  await menu.click();
  const main = page.getByRole("main");
  const bounds = await main.boundingBox();
  expect(bounds).not.toBeNull();
  await main.click({ position: { x: 10, y: bounds!.height - 20 } });
  await expect(
    page.getByRole("navigation", { name: "Mobile", exact: true }),
  ).not.toBeVisible();
  await menu.click();
  await page
    .getByRole("navigation", { name: "Mobile", exact: true })
    .getByRole("link", { name: "HOME" })
    .focus();
  await page.keyboard.press("Control+k");
  await expect(shell.palette).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Mobile", exact: true }),
  ).not.toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
});

test("skip link moves keyboard focus to the main landmark", async ({
  page,
}) => {
  const shell = new ShellPage(page);
  await shell.goto();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
});

test("server-rendered landmarks and mobile navigation remain usable without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    colorScheme: "dark",
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3100");
  await expect(page.getByRole("banner")).toHaveCSS(
    "background-color",
    "rgb(15, 16, 14)",
  );
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await page.getByLabel("Navigation menu", { exact: true }).click();
  await expect(
    page
      .getByRole("navigation", { name: "Mobile", exact: true })
      .getByRole("link", { name: "HOME" }),
  ).toBeVisible();
  await context.close();
});

const viewports = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 430, height: 932 },
  { width: 390, height: 844 },
];
for (const viewport of viewports) {
  for (const theme of ["ink", "paper"] as const) {
    test(`visual shell ${viewport.width}×${viewport.height} ${theme}`, async ({
      page,
    }, testInfo) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await page.setViewportSize(viewport);
      await page.emulateMedia({
        colorScheme: theme === "ink" ? "dark" : "light",
        reducedMotion: "reduce",
      });
      await page.goto("/");
      await expect(
        page.getByRole("button", {
          name: `Use ${theme.toUpperCase()} theme`,
          pressed: true,
        }),
      ).toHaveCount(2);
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      for (const button of await page.getByRole("button").all()) {
        const bounds = await button.boundingBox();
        if (bounds) {
          expect(bounds.height).toBeGreaterThanOrEqual(44);
          expect(bounds.width).toBeGreaterThanOrEqual(44);
        }
      }
      await page.screenshot({
        path: testInfo.outputPath("shell.png"),
        fullPage: true,
      });
      const shell = new ShellPage(page);
      await shell.open();
      await page.screenshot({
        path: testInfo.outputPath("palette.png"),
        fullPage: true,
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.keyboard.press("Escape");
      if (viewport.width < 1200) {
        await page.getByLabel("Navigation menu", { exact: true }).click();
        await page.screenshot({
          path: testInfo.outputPath("menu.png"),
          fullPage: true,
        });
      }
      expect(errors).toEqual([]);
    });
  }
}
