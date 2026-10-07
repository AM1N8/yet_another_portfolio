import { expect, type Page } from "@playwright/test";

export class ShellPage {
  constructor(readonly page: Page) {}
  get palette() {
    return this.page.getByRole("dialog");
  }
  get search() {
    return this.page.getByRole("combobox", { name: "Search commands" });
  }
  get trigger() {
    return this.page.getByRole("button", { name: "Open command palette" });
  }
  async goto() {
    await this.page.goto("/");
    await expect(
      this.page.getByRole("button", { name: "Use PAPER theme", pressed: true }),
    ).toHaveCount(2);
  }
  async open() {
    await this.trigger.click();
    await expect(this.search).toBeFocused();
  }
  async run(query: string) {
    await this.search.fill(query);
    await this.search.press("Enter");
  }
}
