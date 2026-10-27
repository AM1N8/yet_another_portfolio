import { expect, type Page } from "@playwright/test";

export class GalleryPage {
  constructor(readonly page: Page) {}
  get filters() {
    return this.page.getByRole("search", { name: "Filter gallery" });
  }
  get viewer() {
    return this.page.getByRole("dialog");
  }
  get entries() {
    return this.page.locator("[data-artifact]:visible");
  }
  async goto(query = "") {
    await this.page.goto(`/gallery${query}`);
    await expect(
      this.page.getByRole("button", { name: "GRID", exact: true }),
    ).toBeVisible();
  }
  async open(name = "Noor Alerts — system components") {
    await this.page
      .getByRole("link", { name: `View ${name}`, exact: true })
      .click();
    await expect(this.viewer).toBeVisible();
  }
}
