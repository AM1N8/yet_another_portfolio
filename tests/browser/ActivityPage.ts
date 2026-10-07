import { expect, type Page } from "@playwright/test";

export class ActivityPage {
  constructor(readonly page: Page) {}
  get region() {
    return this.page.getByRole("region", {
      name: "Activity Universe",
      exact: true,
    });
  }
  get canvas() {
    return this.region.locator("canvas");
  }
  async goto() {
    await this.page.goto("/#activity");
    await expect(
      this.region.getByRole("button", { name: "ACTIVITY", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect
      .poll(() =>
        this.canvas.evaluate(
          (canvas: HTMLCanvasElement) =>
            canvas.width ===
            Math.round(canvas.getBoundingClientRect().width * devicePixelRatio),
        ),
      )
      .toBe(true);
  }
  async mode(name: string) {
    const button = this.region.getByRole("button", { name, exact: true });
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
  }
  async nodePoint() {
    await this.canvas.scrollIntoViewIfNeeded();
    return this.canvas.evaluate((canvas: HTMLCanvasElement) => {
      const pixels = canvas
        .getContext("2d")!
        .getImageData(0, 0, canvas.width, canvas.height).data;
      for (let index = 3; index < pixels.length; index += 4) {
        if (pixels[index] > 0) {
          const pixel = (index - 3) / 4;
          const box = canvas.getBoundingClientRect();
          return {
            x: box.x + (pixel % canvas.width) / devicePixelRatio,
            y: box.y + Math.floor(pixel / canvas.width) / devicePixelRatio,
          };
        }
      }
      throw new Error("Expected a rendered activity node");
    });
  }
}
