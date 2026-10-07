import assert from "node:assert/strict";
import { test } from "node:test";
import { loadPortfolio } from "../lib/content/loadPortfolio.ts";
import { getCommands, getNavigation } from "../lib/shell.ts";

const portfolio = loadPortfolio();

test("navigation exposes only implemented or external destinations as available", () => {
  const navigation = getNavigation(portfolio);
  assert.ok(navigation.some((item) => item.href === "/" && item.available));
  assert.ok(
    navigation
      .filter((item) => item.href.startsWith("/#"))
      .every((item) => item.available),
  );
  const input = structuredClone(portfolio);
  input.experiments.visible = false;
  input.about.visible = false;
  assert.ok(
    getNavigation(input)
      .filter((item) => ["/#lab", "/#about"].includes(item.href))
      .every((item) => !item.available),
  );
});

test("command flags, content visibility, and privacy control available actions", () => {
  const input = structuredClone(portfolio);
  input.command_palette.actions.github = false;
  input.command_palette.actions.projects = false;
  input.contact.email_public = false;
  input.experiments.visible = false;
  const commands = getCommands(input);
  assert.ok(
    !commands.some(
      (command) => command.id === "github" || command.id === "copy-email",
    ),
  );
  assert.ok(
    !commands.some(
      (command) =>
        command.group === "Projects" || command.group === "Experiments",
    ),
  );
  input.command_palette.enabled = false;
  assert.deepEqual(getCommands(input), []);
});

test("missing resume is omitted; a visible resume with a URL is included", () => {
  const input = structuredClone(portfolio);
  input.contact.resume.url = null;
  assert.ok(!getCommands(input).some((command) => command.id === "resume"));
  input.contact.resume.url = "/resume.pdf";
  const command = getCommands(input).find((command) => command.id === "resume");
  assert.ok(command?.kind === "link");
  assert.equal(command.href, input.contact.resume.url);
  input.contact.resume.visible = false;
  assert.ok(!getCommands(input).some((command) => command.id === "resume"));
});

test("visible project destinations are available", () => {
  const commands = getCommands(portfolio).filter(
    (command) => command.group === "Projects",
  );
  assert.equal(
    commands.length,
    portfolio.projects.entries.filter((entry) => entry.visible).length,
  );
  assert.ok(commands.every((command) => command.available));
});
