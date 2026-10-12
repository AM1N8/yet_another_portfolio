import { test, expect } from "@playwright/test";
import { TerminalPage } from "./TerminalPage";
import { portfolio } from "./portfolio";

test("terminal is lazy, keyboard accessible and restores focus after Escape", async ({
  page,
}) => {
  let requests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/api/terminal")) requests++;
  });
  await page.goto("/");
  expect(requests).toBe(0);
  await expect(page.locator(".xterm")).toHaveCount(0);
  const button = page.getByRole("button", { name: "Open portfolio terminal" });
  await button.focus();
  const shell = new TerminalPage(page);
  await shell.open();
  expect(requests).toBe(1);
  await shell.command("pwd");
  await expect(shell.output).toContainText("/home/amine");
  await shell.command("cd projects/noor-alerts");
  await shell.command("cat README.md");
  await expect(shell.output).toContainText("Case study: /work/noor-alerts");
  await page.keyboard.press("Shift+Tab");
  await expect(
    shell.dialog.getByRole("button", { name: "Close portfolio terminal" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(shell.input).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(shell.dialog).not.toBeVisible();
  await expect(button).toBeFocused();
  await page.keyboard.press("Control+Shift+Backquote");
  await expect(shell.dialog).toBeVisible();
  await page.keyboard.press("Control+Backquote");
  await expect(shell.dialog).not.toBeVisible();
  const palette = page.getByRole("button", { name: "Open command palette" });
  await palette.click();
  await shell.open();
  await page.keyboard.press("Escape");
  await expect(palette).toBeFocused();
});

test("palette opens terminal; completion, history, themes and project navigation work", async ({
  page,
}) => {
  await page.goto("/");
  const launch = page.getByRole("button", { name: "Open command palette" });
  await launch.click();
  await page.getByRole("combobox").fill("terminal");
  await page.keyboard.press("Enter");
  const shell = new TerminalPage(page);
  await expect(shell.dialog.getByRole("status")).toHaveText("Ready");
  await shell.command("echo first");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");
  await shell.command("history");
  await expect(shell.output).toContainText("echo first");
  await page.keyboard.type("fas");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(shell.output).toContainText(portfolio.identity.full_name);
  await shell.command("theme ink");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "ink");
  await shell.command("resume");
  await expect(shell.output).toContainText("No public résumé URL");
  await shell.command("unavailable-command");
  await expect(shell.output).toContainText("command not found");
  await shell.command("open noor-alerts");
  await expect(page).toHaveURL(/\/work\/noor-alerts$/);
  await expect(shell.dialog).not.toBeVisible();
});

test("cmatrix ignores outside clicks, stops on Ctrl+C and releases timers on close", async ({
  page,
}) => {
  await page.goto("/");
  const shell = new TerminalPage(page);
  await shell.open();
  await shell.command("cmatrix");
  await expect(shell.dialog.getByRole("status")).toHaveText(
    "CMATRIX / CTRL+C TO STOP",
  );
  await page.mouse.click(5, 5);
  await expect(shell.dialog).toBeVisible();
  await page.keyboard.press("Control+c");
  await expect(shell.dialog.getByRole("status")).toHaveText("Ready");
  await shell.command("pwd");
  await expect(shell.output).toContainText("/home/amine");
  await shell.command("cmatrix");
  await page.keyboard.press("Escape");
  await expect(page.locator(".xterm")).toHaveCount(0);
  await shell.open();
  await shell.command("pwd");
  await expect(shell.output).toContainText("/home/amine");
  await page.mouse.click(5, 5);
  await expect(shell.dialog).not.toBeVisible();
});

test("public terminal content contains no private contact or environment configuration", async ({
  request,
}) => {
  const response = await request.get("/api/terminal");
  expect(response.ok()).toBeTruthy();
  const text = await response.text();
  expect(text).not.toContain("GITHUB_TOKEN");
  if (portfolio.contact.phone && !portfolio.contact.phone_public)
    expect(text).not.toContain(portfolio.contact.phone);
  expect(JSON.parse(text).links.resume).toBeNull();
});

for (const [width, height] of [
  [1920, 1080],
  [1440, 900],
  [768, 1024],
  [430, 932],
  [390, 844],
]) {
  for (const theme of ["ink", "paper"] as const) {
    test(`terminal visual ${width}×${height} ${theme}`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({
        colorScheme: theme === "ink" ? "dark" : "light",
        reducedMotion: "reduce",
      });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("/");
      const shell = new TerminalPage(page);
      await shell.open();
      await shell.command("fastfetch");
      await expect(shell.output).toContainText(portfolio.identity.full_name);
      const bounds = await shell.dialog.boundingBox();
      expect(bounds!.width).toBeLessThanOrEqual(width);
      expect(bounds!.height).toBeLessThanOrEqual(height);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
      await page.screenshot({ path: testInfo.outputPath("terminal.png") });
      await shell.command("cmatrix");
      await expect(shell.dialog.getByRole("status")).toContainText("CMATRIX");
      await page.screenshot({ path: testInfo.outputPath("cmatrix.png") });
      await page.keyboard.press("Escape");
      expect(errors).toEqual([]);
    });
  }
}
