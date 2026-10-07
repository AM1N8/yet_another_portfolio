import { test, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";

test("each held letter and its intermediate cloud are visually reviewable", async ({
  page,
}, testInfo) => {
  const start = new Date("2026-10-07T12:00:00Z");
  await page.clock.install({ time: start });
  await page.clock.pauseAt(start);
  await page.emulateMedia({
    colorScheme: "dark",
    reducedMotion: "no-preference",
  });
  await page.goto("/");
  const figure = page.getByRole("figure", { name: "CDXV morphing cell field" });
  await expect(
    figure.getByRole("button", { name: "Pause motion" }),
  ).toBeVisible();
  await page.clock.runFor(100);
  for (const letter of ["C", "D", "X", "V"]) {
    await figure.screenshot({ path: testInfo.outputPath(`${letter}.png`) });
    await page.clock.runFor(1750);
    await figure.screenshot({
      path: testInfo.outputPath(`${letter}-reflow.png`),
    });
    await page.clock.runFor(1250);
  }
});

test("cursor carves a moving gap in the cell field and cells flow back after it leaves", async ({
  page,
}, testInfo) => {
  const start = new Date("2026-10-07T12:00:00Z");
  await page.clock.install({ time: start });
  await page.clock.pauseAt(start);
  await page.emulateMedia({
    colorScheme: "dark",
    reducedMotion: "no-preference",
  });
  await page.goto("/");
  const figure = page.getByRole("figure", { name: "CDXV morphing cell field" });
  await expect(
    figure.getByRole("button", { name: "Pause motion" }),
  ).toBeVisible();
  const canvas = figure.locator("canvas");
  await page.clock.runFor(700);
  const pixelsNearPointer = () =>
    canvas.evaluate((element: HTMLCanvasElement) => {
      const image = element
        .getContext("2d")!
        .getImageData(0, 0, element.width, element.height);
      const centerX = (125 / 480) * element.width;
      const centerY = (240 / 480) * element.height;
      const radius = (22 / 480) * element.width;
      let occupied = 0;
      for (let y = Math.floor(centerY - radius); y <= centerY + radius; y++) {
        for (let x = Math.floor(centerX - radius); x <= centerX + radius; x++) {
          if (
            Math.hypot(x - centerX, y - centerY) < radius &&
            image.data[(y * image.width + x) * 4 + 3] > 0
          )
            occupied++;
        }
      }
      return occupied;
    });
  const before = await pixelsNearPointer();
  expect(before).toBeGreaterThan(30);
  const bounds = (await canvas.boundingBox())!;
  await page.mouse.move(
    bounds.x + (bounds.width * 125) / 480,
    bounds.y + bounds.width / 2,
  );
  await page.clock.runFor(350);
  const pushed = await pixelsNearPointer();
  expect(pushed).toBeLessThan(before * 0.55);
  await figure.screenshot({
    path: testInfo.outputPath("cursor-displacement.png"),
  });
  await page.mouse.move(bounds.x - 20, bounds.y - 20);
  await page.clock.runFor(500);
  expect(await pixelsNearPointer()).toBeGreaterThan(pushed + 30);
  await figure.screenshot({ path: testInfo.outputPath("cursor-return.png") });
});

for (const width of [1440, 390]) {
  test(`fluid simulation frame cost at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const session = await page.context().newCDPSession(page);
    if (width === 390)
      await session.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.addInitScript(() => {
      const metrics = { draws: 0, durations: [] as number[] };
      Object.assign(window, { fluidMetrics: metrics });
      const clear = CanvasRenderingContext2D.prototype.clearRect;
      CanvasRenderingContext2D.prototype.clearRect = function (...args) {
        if (this.canvas.closest(".hero-morph-stage")) metrics.draws++;
        return clear.apply(this, args);
      };
      const raf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (callback) =>
        raf((time) => {
          const before = metrics.draws;
          const start = performance.now();
          callback(time);
          if (metrics.draws > before)
            metrics.durations.push(performance.now() - start);
        });
    });
    await page.goto("/");
    const figure = page.getByRole("figure", {
      name: "CDXV morphing cell field",
    });
    await figure.scrollIntoViewIfNeeded();
    await expect(
      figure.getByRole("button", { name: "Pause motion" }),
    ).toBeVisible();
    const bounds = (await figure.locator("canvas").boundingBox())!;
    await page.mouse.move(
      bounds.x + bounds.width * 0.26,
      bounds.y + bounds.width * 0.5,
    );
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { fluidMetrics: { durations: number[] } })
              .fluidMetrics.durations.length,
        ),
      )
      .toBeGreaterThan(90);
    const timings = await page.evaluate(() => {
      const values = (
        window as unknown as { fluidMetrics: { durations: number[] } }
      ).fluidMetrics.durations
        .slice(-90)
        .sort((a, b) => a - b);
      return {
        samples: values.length,
        mean: values.reduce((a, b) => a + b, 0) / values.length,
        p95: values[Math.floor(values.length * 0.95)],
        max: values[values.length - 1],
      };
    });
    const profile = testInfo.outputPath("fluid-frame-profile.json");
    await writeFile(
      profile,
      JSON.stringify(
        { width, cpuSlowdown: width === 390 ? 4 : 1, ...timings },
        null,
        2,
      ),
    );
    await testInfo.attach("fluid-frame-profile", {
      path: profile,
      contentType: "application/json",
    });
    expect(timings.p95).toBeLessThan(16.7);
    await session.detach();
  });
}

test("hero morph animates, pauses by keyboard, suspends offscreen/hidden, and becomes static with reduced motion", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.assign(window, { heroDraws: 0 });
    const clear = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas.closest(".hero-morph-stage"))
        (window as unknown as { heroDraws: number }).heroDraws++;
      return clear.apply(this, args);
    };
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const figure = page.getByRole("figure", {
    name: "CDXV morphing cell field",
    exact: true,
  });
  const pause = figure.getByRole("button", {
    name: "Pause motion",
    exact: true,
  });
  await expect(pause).toBeVisible();
  const canvas = figure.locator("canvas");
  const first = await canvas.evaluate((element: HTMLCanvasElement) =>
    element.toDataURL(),
  );
  await expect
    .poll(
      () =>
        canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL()),
      {
        timeout: 6000,
      },
    )
    .not.toBe(first);
  await pause.focus();
  await page.keyboard.press("Enter");
  await expect(
    figure.getByRole("button", { name: "Resume motion", pressed: true }),
  ).toBeVisible();
  const isStill = () =>
    page.evaluate(async () => {
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
      const start = (window as unknown as { heroDraws: number }).heroDraws;
      await new Promise((resolve) => setTimeout(resolve, 250));
      return start === (window as unknown as { heroDraws: number }).heroDraws;
    });
  expect(await isStill()).toBeTruthy();
  await figure.getByRole("button", { name: "Resume motion" }).click();
  await page.locator("#work").scrollIntoViewIfNeeded();
  expect(await isStill()).toBeTruthy();
  await figure.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(await isStill()).toBeTruthy();
  await page.evaluate(() => {
    Reflect.deleteProperty(document, "hidden");
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(pause).not.toBeVisible();
  expect(await isStill()).toBeTruthy();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      canvas.evaluate(
        (element: HTMLCanvasElement) =>
          element.width ===
          Math.round(
            element.getBoundingClientRect().width *
              Math.min(devicePixelRatio, 2),
          ),
      ),
    )
    .toBeTruthy();
  expect(errors).toEqual([]);
});

test("hero has a complete static CDXV fallback without JavaScript or Canvas", async ({
  browser,
  page,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage();
  await staticPage.goto("http://127.0.0.1:3100/");
  await expect(
    staticPage
      .getByRole("figure", { name: "CDXV morphing cell field" })
      .locator("svg"),
  ).toBeVisible();
  await context.close();
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = (() =>
      null) as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto("/");
  const figure = page.getByRole("figure", { name: "CDXV morphing cell field" });
  await expect(figure.locator("svg")).toBeVisible();
  await expect(figure.getByRole("button")).not.toBeVisible();
});

for (const [width, height] of [
  [1920, 1080],
  [1440, 900],
  [768, 1024],
  [430, 932],
  [390, 844],
]) {
  for (const theme of ["ink", "paper"] as const) {
    test(`hero morph visual ${width}×${height} ${theme}`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({
        colorScheme: theme === "ink" ? "dark" : "light",
        reducedMotion: "no-preference",
      });
      await page.goto("/");
      const figure = page.getByRole("figure", {
        name: "CDXV morphing cell field",
      });
      await figure.scrollIntoViewIfNeeded();
      await expect(
        figure.getByRole("button", { name: "Pause motion" }),
      ).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await figure.screenshot({ path: testInfo.outputPath("morph.png") });
      await page
        .locator("#home")
        .screenshot({ path: testInfo.outputPath("hero.png") });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page
        .locator("#home")
        .screenshot({ path: testInfo.outputPath("static-hero.png") });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
    });
  }
}
