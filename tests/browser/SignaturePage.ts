import { expect, type Page } from "@playwright/test";

export class SignaturePage {
  constructor(readonly page: Page) {}
  get region() {
    return this.page.getByRole("contentinfo").getByRole("figure", {
      name: "CDXV signature graph",
      exact: true,
    });
  }
  get pulse() {
    return this.region.getByRole("button", {
      name: "Pulse the CDXV point matrix",
    });
  }
  async goto() {
    await this.page.goto("/#footer-signature");
    await this.region.scrollIntoViewIfNeeded();
    await expect(this.pulse).toBeVisible();
  }
}
