import { test, expect } from "@playwright/test";
import { ActivityPage } from "./ActivityPage";
import { writeFile } from "node:fs/promises";

declare global {
  interface Window {
    activityProfile: {
      draws: number;
      lcp: number;
      longTasks: number[];
      frameCosts: number[];
    };
  }
}

for (const width of [1440, 390]) {
  test(`activity performance and lifecycle ${width}`, async ({
    page,
    context,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => {
      window.activityProfile = {
        draws: 0,
        lcp: 0,
        longTasks: [],
        frameCosts: [],
      };
      const raf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (callback) =>
        raf((time) => {
          const draws = window.activityProfile.draws;
          const start = performance.now();
          callback(time);
          if (draws !== window.activityProfile.draws)
            window.activityProfile.frameCosts.push(performance.now() - start);
        });
      const clear = CanvasRenderingContext2D.prototype.clearRect;
      CanvasRenderingContext2D.prototype.clearRect = function (...args) {
        window.activityProfile.draws++;
        return clear.apply(this, args);
      };
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          window.activityProfile.lcp = entry.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          window.activityProfile.longTasks.push(entry.duration);
      }).observe({ type: "longtask", buffered: true });
    });
    const cdp = await context.newCDPSession(page);
    await cdp.send("Performance.enable");
    if (width === 390)
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);
    const initialScripts = await page.evaluate(() =>
      performance
        .getEntriesByType("resource")
        .filter((entry) => entry.name.endsWith(".js"))
        .map((entry) => entry.name),
    );
    const activity = new ActivityPage(page);
    await activity.region.scrollIntoViewIfNeeded();
    await expect(activity.canvas).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => window.activityProfile.draws))
      .toBeGreaterThan(0);
    const deferredScripts = await page.evaluate(
      (initial) =>
        performance
          .getEntriesByType("resource")
          .filter(
            (entry) =>
              entry.name.endsWith(".js") && !initial.includes(entry.name),
          )
          .map((entry) => entry.name),
      initialScripts,
    );
    expect(deferredScripts.length).toBeGreaterThan(0);
    const metrics = async () =>
      (await cdp.send("Performance.getMetrics")).metrics;
    await cdp.send("HeapProfiler.collectGarbage");
    const before = await metrics();
    for (let index = 0; index < 3; index++) {
      for (const mode of ["PROJECTS", "LANGUAGES", "TIMELINE", "ACTIVITY"])
        await activity.mode(mode);
    }
    // Fixed observation windows measure idle drawing, rather than synchronize UI.
    const observeIdle = async () =>
      page.evaluate(async () => {
        const before = window.activityProfile.draws;
        await new Promise((resolve) => setTimeout(resolve, 500));
        return window.activityProfile.draws - before;
      });
    await page.evaluate(() => scrollTo(0, 0));
    await expect(activity.region).not.toBeInViewport();
    // Wait for the observer to deliver, then verify a complete idle window.
    await expect.poll(observeIdle).toBe(0);
    await activity.region.scrollIntoViewIfNeeded();
    const drawsBeforeResume = await page.evaluate(
      () => window.activityProfile.draws,
    );
    await activity.mode("PROJECTS");
    await expect
      .poll(() => page.evaluate(() => window.activityProfile.draws))
      .toBeGreaterThan(drawsBeforeResume);
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(await observeIdle()).toBe(0);
    await page.evaluate(() => {
      Reflect.deleteProperty(document, "hidden");
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await activity.mode("LANGUAGES");
    expect(await observeIdle()).toBe(0);
    const resizeStart = await page.evaluate(() => window.activityProfile.draws);
    for (const next of [width - 20, width - 40, width - 10, width - 60])
      await page.setViewportSize({ width: next, height: 900 });
    await expect
      .poll(() =>
        activity.canvas.evaluate(
          (canvas: HTMLCanvasElement) =>
            canvas.width ===
            Math.round(canvas.getBoundingClientRect().width * devicePixelRatio),
        ),
      )
      .toBe(true);
    const resizeDraws = await page.evaluate(
      (start) => window.activityProfile.draws - start,
      resizeStart,
    );
    await cdp.send("HeapProfiler.collectGarbage");
    const after = await metrics();
    const value = (entries: typeof before, name: string) =>
      entries.find((entry) => entry.name === name)!.value;
    const heapGrowth =
      value(after, "JSHeapUsedSize") - value(before, "JSHeapUsedSize");
    expect(heapGrowth).toBeLessThan(5_000_000);
    const profile = await page.evaluate(() => window.activityProfile);
    const report = JSON.stringify(
      {
        width,
        cpuThrottle: width === 390 ? 4 : 1,
        ...profile,
        deferredScripts,
        heapGrowth,
        resizeDraws,
        scriptSeconds:
          value(after, "ScriptDuration") - value(before, "ScriptDuration"),
        taskSeconds:
          value(after, "TaskDuration") - value(before, "TaskDuration"),
      },
      null,
      2,
    );
    await writeFile(testInfo.outputPath("performance.json"), report);
    await testInfo.attach("performance.json", {
      body: report,
      contentType: "application/json",
    });
    await page
      .getByRole("link", { name: /View case study for Noor Alerts/ })
      .click();
    expect(await observeIdle()).toBe(0);
  });
}
