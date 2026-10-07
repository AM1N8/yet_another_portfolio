import { test, expect } from "@playwright/test";
import { SignaturePage } from "./SignaturePage";

test("signature supports keyboard, pointer, theme changes and lifecycle cleanup without activity APIs", async ({
  page,
}) => {
  const requests: string[] = [];
  const errors: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const original = CanvasRenderingContext2D.prototype.clearRect;
    Object.assign(window, { signatureDraws: 0 });
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas.closest(".signature-stage"))
        (window as unknown as { signatureDraws: number }).signatureDraws++;
      return original.apply(this, args);
    };
  });
  const signature = new SignaturePage(page);
  await signature.goto();
  await expect(page.getByRole("main").locator("canvas")).toHaveCount(1);
  await expect(page.locator("#activity")).toHaveCount(0);
  await expect(page.getByText("Signature field", { exact: true })).toHaveCount(
    0,
  );
  await signature.pulse.focus();
  await page.keyboard.press("Enter");
  const canvas = signature.region.locator("canvas");
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2);
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { signatureDraws: number }).signatureDraws,
      ),
    )
    .toBeGreaterThan(1);
  await page
    .getByRole("banner")
    .getByRole("button", { name: "Use INK theme", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "ink");
  await page.evaluate(() => scrollTo(0, 0));
  await expect(signature.pulse).not.toBeInViewport();
  // An observation interval verifies a suspended loop rather than waiting for UI readiness.
  const still = await page.evaluate(async () => {
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    const start = (window as unknown as { signatureDraws: number })
      .signatureDraws;
    await new Promise((resolve) => setTimeout(resolve, 200));
    return (
      start === (window as unknown as { signatureDraws: number }).signatureDraws
    );
  });
  expect(still).toBeTruthy();
  await signature.region.scrollIntoViewIfNeeded();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await signature.pulse.click();
  const steady = await page.evaluate(async () => {
    const start = (window as unknown as { signatureDraws: number })
      .signatureDraws;
    await new Promise((resolve) => setTimeout(resolve, 200));
    return (
      start === (window as unknown as { signatureDraws: number }).signatureDraws
    );
  });
  expect(steady).toBeTruthy();
  expect(requests.some((url) => url.includes("api.github.com"))).toBeFalsy();
  expect(await signature.region.textContent()).not.toMatch(
    /AM1N8|contributions|snapshot/i,
  );
  expect(errors).toEqual([]);
});

test("complete signature remains readable without JavaScript or Canvas", async ({
  browser,
  page,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const staticPage = await context.newPage();
  await staticPage.goto("http://127.0.0.1:3100/#footer-signature");
  await expect(
    staticPage.getByRole("img", { name: /CDXV, constructed/ }),
  ).toBeVisible();
  await expect(
    staticPage.getByText(/Four geometric contours form CDXV/),
  ).toBeVisible();
  await expect(
    staticPage.getByRole("button", { name: "Pulse the CDXV point matrix" }),
  ).not.toBeVisible();
  await context.close();
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = (() =>
      null) as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto("/#footer-signature");
  await expect(
    page.getByRole("img", { name: /CDXV, constructed/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Pulse the CDXV point matrix" }),
  ).not.toBeVisible();
});

for (const [width, height] of [
  [1920, 1080],
  [1440, 900],
  [768, 1024],
  [430, 932],
  [390, 844],
]) {
  for (const theme of ["paper", "ink"] as const) {
    test(`signature visual ${width}×${height} ${theme}`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({
        colorScheme: theme === "ink" ? "dark" : "light",
        reducedMotion: "reduce",
      });
      const signature = new SignaturePage(page);
      await signature.goto();
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
      const target = (await signature.pulse.boundingBox())!;
      expect(target.height).toBeGreaterThanOrEqual(44);
      await signature.region.screenshot({
        path: testInfo.outputPath("signature.png"),
      });
      await page.getByRole("contentinfo").screenshot({
        path: testInfo.outputPath("footer.png"),
      });
    });
  }
}
