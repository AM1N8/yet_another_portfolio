import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { loadPortfolio } from "../lib/content/loadPortfolio.ts";
import { galleryItemSchema, portfolioSchema } from "../lib/content/schema.ts";
import {
  filterGallery,
  galleryUrl,
  getGalleryItems,
  readGalleryState,
} from "../lib/gallery.ts";
import { createTerminalContent } from "../components/terminal/content.ts";
import { VirtualFilesystem } from "../components/terminal/filesystem.ts";
import { executeCommand } from "../components/terminal/commands.ts";
import { getCommands, getNavigation } from "../lib/shell.ts";

const portfolio = loadPortfolio();
const items = getGalleryItems(portfolio);
const initial = readGalleryState(new URLSearchParams());

test("every uploaded gallery PNG is registered with its actual intrinsic dimensions", () => {
  const directory = new URL("../public/gallery/", import.meta.url);
  const files = readdirSync(directory).filter((file) => file.endsWith(".png"));
  assert.ok(files.length > 0);
  for (const file of files) {
    const item = items.find((entry) => entry.image === `/gallery/${file}`);
    assert.ok(item, `Missing gallery entry for ${file}`);
    const image = readFileSync(new URL(encodeURIComponent(file), directory));
    assert.equal(image.subarray(1, 4).toString(), "PNG");
    assert.equal(item.width, image.readUInt32BE(16), file);
    assert.equal(item.height, image.readUInt32BE(20), file);
    assert.ok(item.alt.trim().length > 20, file);
  }
});

test("gallery schema validates image geometry, alt text, references, dates and unique ids", () => {
  assert.equal(galleryItemSchema.safeParse(items[0]).success, false); // derived display fields are not YAML fields
  const source = portfolio.gallery.items[0];
  assert.ok(galleryItemSchema.safeParse(source).success);
  for (const change of [
    { width: 0 },
    { alt: " " },
    { date: "2026-02-30" },
    { links: { external: "javascript:alert(1)" } },
  ]) {
    assert.equal(
      galleryItemSchema.safeParse({ ...source, ...change }).success,
      false,
    );
  }
  const input = structuredClone(portfolio);
  input.gallery.items.push({ ...source });
  assert.equal(portfolioSchema.safeParse(input).success, false);
  input.gallery.items.pop();
  input.gallery.items[0].project_slug = "missing-project";
  assert.equal(portfolioSchema.safeParse(input).success, false);
});

test("gallery filters combine project, type, year and all search terms with shareable URL state", () => {
  assert.equal(
    filterGallery(items, { ...initial, type: "architecture" }).length,
    2,
  );
  assert.deepEqual(
    filterGallery(items, {
      ...initial,
      project: "noor-alerts",
      type: "architecture",
      year: "2026",
      q: "graphRAG component",
    }).map((item) => item.id),
    ["noor-components"],
  );
  assert.deepEqual(
    filterGallery(items, {
      ...initial,
      project: "noor-alerts",
      type: "result",
    }),
    [],
  );
  assert.equal(
    filterGallery(items, { ...initial, q: "7,394" })[0].id,
    "trajectory-results",
  );
  const state = {
    ...initial,
    project: "noor-alerts",
    type: "architecture",
    q: "NLP & SCADA",
    view: "index" as const,
    item: "noor-components",
  };
  assert.deepEqual(
    readGalleryState(
      new URL(galleryUrl(state), "https://example.com").searchParams,
    ),
    state,
  );
  assert.equal(galleryUrl(initial), "/gallery");
});

test("hidden projects and artifacts are omitted, while absent optional metadata remains usable", () => {
  const input = structuredClone(portfolio);
  input.projects.entries[0].visible = false;
  assert.ok(
    !getGalleryItems(input).some((item) => item.project_slug === "noor-alerts"),
  );
  input.gallery.items[1].visible = false;
  assert.equal(getGalleryItems(input).length, items.length - 2);
  input.gallery.visible = false;
  assert.deepEqual(getGalleryItems(input), []);
  const minimal = galleryItemSchema.parse({
    id: "minimal",
    title: "Document",
    type: "experiment",
    image: "/document.webp",
    width: 300,
    height: 200,
    alt: "Document preview",
  });
  assert.equal(minimal.caption, undefined);
  assert.deepEqual(minimal.tags, []);
  assert.equal(minimal.visible, true);
});

test("Gallery navigation, palette and terminal use available destinations and validated parameters", () => {
  assert.ok(
    getNavigation(portfolio).some(
      (item) => item.href === "/gallery" && item.available,
    ),
  );
  assert.ok(
    getCommands(portfolio).some(
      (item) => item.label === "GALLERY" && item.kind === "link",
    ),
  );
  const content = createTerminalContent(portfolio);
  const context = {
    content,
    fs: new VirtualFilesystem(content),
    cwd: content.home,
    history: [],
    theme: "ink",
    columns: 80,
  };
  assert.deepEqual(executeCommand("gallery", context).action, {
    kind: "open",
    href: "/gallery",
  });
  assert.deepEqual(
    executeCommand("gallery noor-alerts --type architecture", context).action,
    { kind: "open", href: "/gallery?project=noor-alerts&type=architecture" },
  );
  assert.deepEqual(executeCommand("gallery --type result", context).action, {
    kind: "open",
    href: "/gallery?type=result",
  });
  assert.deepEqual(executeCommand("gallery --type demo", context).action, {
    kind: "open",
    href: "/gallery?type=demo",
  });
  assert.equal(
    executeCommand("gallery https://example.com", context).action,
    undefined,
  );
  assert.equal(
    executeCommand("gallery --type invalid", context).action,
    undefined,
  );
});
