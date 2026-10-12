import { expect, type Page } from "@playwright/test";
import { portfolio } from "./portfolio";

export class TerminalPage {
  constructor(readonly page: Page) {}
  get dialog() {
    return this.page.getByRole("dialog", {
      name: `${portfolio.site.brand_label} / TERMINAL`,
    });
  }
  get input() {
    return this.dialog.locator("textarea.xterm-helper-textarea");
  }
  get output() {
    return this.dialog.locator(".xterm-accessibility-tree");
  }
  async open() {
    await expect(
      this.page.locator('[data-theme-option][aria-pressed="true"]'),
    ).toHaveCount(2);
    await this.page.keyboard.press("Control+Backquote");
    await expect(this.dialog).toBeVisible();
    await expect(this.dialog.getByRole("status")).toHaveText("Ready");
    await expect(this.input).toBeFocused();
  }
  async command(value: string) {
    await this.input.focus();
    await this.page.keyboard.type(value);
    await this.page.keyboard.press("Enter");
  }
}
