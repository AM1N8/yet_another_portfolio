import { test, expect } from "@playwright/test";
import { THEMES } from "../../lib/themes/registry";
import { TerminalPage } from "./TerminalPage";

test("rapid terminal-only themes refresh Canvas and the same xterm without stale colors or extra loops", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  let contentRequests = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/terminal")) contentRequests++;
  });
  await page.addInitScript(() => {
    const original = CanvasRenderingContext2D.prototype.fill;
    const computed = window.getComputedStyle;
    Object.assign(window, {
      heroStyles: [] as string[],
      heroReads: 0,
      heroFrames: 0,
    });
    CanvasRenderingContext2D.prototype.fill = function (
      this: CanvasRenderingContext2D,
      ...args: unknown[]
    ) {
      if (this.canvas.classList.contains("hero-morph-canvas")) {
        const stats = window as unknown as {
          heroStyles: string[];
          heroFrames: number;
        };
        stats.heroFrames++;
        stats.heroStyles.push(String(this.fillStyle));
        if (stats.heroStyles.length > 100) stats.heroStyles.shift();
      }
      return Reflect.apply(original, this, args);
    } as typeof original;
    window.getComputedStyle = (element, pseudo) => {
      if (element.classList.contains("hero-morph-canvas"))
        (window as unknown as { heroReads: number }).heroReads++;
      return computed(element, pseudo);
    };
  });
  await page.goto("/");
  await expect(
    page.locator('.hero-morph-stage[data-enhanced="true"]'),
  ).toBeVisible();
  const terminal = new TerminalPage(page);
  await terminal.open();
  await terminal.input.evaluate((element) => {
    element.dataset.instance = "original";
  });
  for (const theme of [
    "ink",
    "catppuccin",
    "tokyonight",
    "ayu",
    "gruvbox",
    "paper",
  ]) {
    await terminal.command(`theme ${theme}`);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(terminal.output).toContainText(`theme: ${theme}`);
    await expect(terminal.input).toHaveAttribute("data-instance", "original");
    const hot = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--particle-hot")
        .trim(),
    );
    await expect
      .poll(() =>
        page.evaluate(
          (color) =>
            (window as unknown as { heroStyles: string[] }).heroStyles.includes(
              color,
            ),
          hot,
        ),
      )
      .toBe(true);
    // xterm's default DOM renderer updates its ANSI stylesheet in place.
    const expected = await terminal.dialog.evaluate((element) => {
      const color = getComputedStyle(element)
        .getPropertyValue("--ansi-green")
        .trim();
      const probe = document.createElement("span");
      probe.style.color = color;
      element.append(probe);
      const resolved = getComputedStyle(probe).color;
      probe.remove();
      return resolved;
    });
    await expect(terminal.dialog.locator(".xterm-fg-2").last()).toHaveCSS(
      "color",
      expected,
    );
  }
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as unknown as { heroStyles: string[] }).heroStyles.includes(
          "#39d353",
        ),
      ),
    )
    .toBe(true);
  const before = await page.evaluate(
    () => (window as unknown as { heroFrames: number }).heroFrames,
  );
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { heroFrames: number }).heroFrames,
      ),
    )
    .toBeGreaterThan(before + 90);
  expect(
    await page.evaluate(
      () => (window as unknown as { heroReads: number }).heroReads,
    ),
  ).toBeLessThan(15);
  expect(contentRequests).toBe(1);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Open command palette" }).click();
  for (const theme of THEMES.filter((theme) => theme.hidden))
    await expect(page.getByRole("dialog")).not.toContainText(theme.label);
  await page.keyboard.press("Escape");
  expect(errors).toEqual([]);
});

for (const theme of THEMES.filter((theme) => theme.hidden)) {
  test(`${theme.name} persists and restores before hydration; INK/PAPER override it`, async ({
    page,
  }) => {
    await page.goto("/");
    const shell = new TerminalPage(page);
    await shell.open();
    await shell.command(`theme ${theme.aliases[0]}`);
    await shell.command("theme current");
    await expect(shell.output).toContainText(`theme: ${theme.name}`);
    await shell.command("theme invalid");
    await expect(shell.output).toContainText("Unknown theme");
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      theme.name,
    );
    await page.route(/\/_next\/.*\.js(?:\?|$)/, (route) => route.abort());
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      theme.name,
    );
    await expect(page.getByRole("banner")).toHaveCSS(
      "background-color",
      await page.evaluate(
        () => getComputedStyle(document.body).backgroundColor,
      ),
    );
    await page.unrouteAll();
    await page.reload();
    await page
      .getByRole("banner")
      .getByRole("button", { name: "Use INK theme" })
      .click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "ink");
    await page
      .getByRole("banner")
      .getByRole("button", { name: "Use PAPER theme" })
      .click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "paper");
  });
}

for (const [width, height] of [
  [1440, 900],
  [390, 844],
]) {
  for (const theme of THEMES) {
    test(`palette visual ${theme.name} ${width}×${height}`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({
        colorScheme: "light",
        reducedMotion: "reduce",
      });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("/");
      const shell = new TerminalPage(page);
      await shell.open();
      await shell.command(`theme ${theme.name}`);
      await shell.command("theme list");
      await expect(shell.output).toContainText("Gruvbox Dark");
      await page.screenshot({ path: testInfo.outputPath("terminal.png") });
      await page.keyboard.press("Escape");
      await documentReady();
      const contrasts = await page.evaluate(() => {
        const style = getComputedStyle(document.documentElement);
        const probe = document.createElement("canvas").getContext("2d")!;
        const rgb = (color: string) => {
          probe.fillStyle = color;
          probe.fillRect(0, 0, 1, 1);
          return [...probe.getImageData(0, 0, 1, 1).data].slice(0, 3);
        };
        const luminance = (color: number[]) =>
          color
            .map((value) => {
              const channel = value / 255;
              return channel <= 0.04045
                ? channel / 12.92
                : ((channel + 0.055) / 1.055) ** 2.4;
            })
            .reduce(
              (sum, value, index) =>
                sum + value * [0.2126, 0.7152, 0.0722][index],
              0,
            );
        const contrast = (a: string, b: string) => {
          const first = luminance(rgb(style.getPropertyValue(a))),
            second = luminance(rgb(style.getPropertyValue(b)));
          return (
            (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
          );
        };
        return {
          body: contrast("--text", "--bg"),
          muted: contrast("--text-muted-readable", "--bg"),
          terminal: contrast("--terminal-fg", "--terminal-bg"),
          terminalMuted: contrast("--terminal-muted", "--terminal-bg"),
          prompt: contrast("--ansi-green", "--terminal-bg"),
          control: contrast("--control-border", "--bg"),
          ...Object.fromEntries(
            [
              "black",
              "red",
              "green",
              "yellow",
              "blue",
              "magenta",
              "cyan",
              "white",
            ].map((color) => [
              `ansi-${color}`,
              contrast(`--ansi-${color}`, "--terminal-bg"),
            ]),
          ),
        };
      });
      for (const [name, ratio] of Object.entries(contrasts))
        expect(ratio, `${theme.name} ${name}`).toBeGreaterThanOrEqual(
          name === "control" ? 3 : 4.5,
        );
      await page.screenshot({
        path: testInfo.outputPath("homepage.png"),
        fullPage: true,
      });
      for (const id of ["home", "work", "lab", "timeline", "stack", "contact"])
        await page
          .locator(`#${id}`)
          .screenshot({ path: testInfo.outputPath(`${id}.png`) });
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.locator("#home").scrollIntoViewIfNeeded();
      await expect(
        page.locator('.hero-morph-stage[data-enhanced="true"]'),
      ).toBeVisible();
      await page
        .locator("#home")
        .screenshot({ path: testInfo.outputPath("fluid-hero.png") });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.getByRole("button", { name: "Open command palette" }).click();
      await page.screenshot({ path: testInfo.outputPath("palette.png") });
      await page.keyboard.press("Escape");
      await page.goto("/work/noor-alerts");
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        theme.name,
      );
      await page.screenshot({
        path: testInfo.outputPath("case-study.png"),
        fullPage: true,
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(errors).toEqual([]);
      async function documentReady() {
        await page.evaluate(() => document.fonts.ready);
      }
    });
  }
}
