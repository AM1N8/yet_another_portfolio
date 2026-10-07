import { test, expect } from "@playwright/test";
import { portfolio } from "./portfolio";
import { ShellPage } from "./ShellPage";

const projects = portfolio.projects.entries.filter(
  (project) => project.visible,
);
for (const project of projects) {
  test(`${project.slug} renders source content, metadata and only populated sections`, async ({
    page,
  }) => {
    const response = await page.goto(`/work/${project.slug}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      project.title,
    );
    await expect(page).toHaveTitle(
      portfolio.site.seo.title_template.replace(
        "%s",
        project.seo?.title || project.title,
      ),
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      project.seo?.description || project.one_liner,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      new URL(`/work/${project.slug}`, portfolio.site.canonical_url).href,
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      project.seo?.title || project.title,
    );
    for (const [heading, available] of [
      ["Problem", Boolean(project.problem?.trim())],
      ["Why it matters", Boolean(project.why_it_matters?.trim())],
      ["Constraints", project.constraints.length > 0],
      ["Engineering decisions", project.engineering_decisions.length > 0],
      ["Challenges", project.challenges.length > 0],
      ["Iterations", project.iterations.length > 0],
      ["Results", project.results.length > 0],
      ["Lessons", Boolean(project.lessons?.trim())],
      ["Next steps", Boolean(project.next_steps?.trim())],
      [
        "Media",
        Boolean(
          project.media?.gallery.length ||
          project.media?.demo_video ||
          project.media?.thumbnail,
        ),
      ],
    ] as const)
      await expect(
        page.getByRole("heading", { name: heading, exact: true }),
      ).toHaveCount(available ? 1 : 0);
    for (const result of project.results)
      await expect(page.getByText(result.value, { exact: true })).toBeVisible();
    for (const component of project.architecture?.components ?? [])
      await expect(
        page.getByRole("figure").getByText(component, { exact: true }),
      ).toBeVisible();
    await expect(page.getByText("N/A", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("main").locator("canvas")).toHaveCount(0);
    await expect(page.getByRole("contentinfo").locator("canvas")).toHaveCount(
      1,
    );
  });
}

test("homepage and keyboard palette navigate to generated case studies; unknown slug is 404", async ({
  page,
}) => {
  await page.goto("/");
  const project = projects[0]!;
  await page
    .getByRole("link", { name: `View case study for ${project.title}` })
    .click();
  await expect(page).toHaveURL(`/work/${project.slug}`);
  const shell = new ShellPage(page);
  await shell.open();
  await shell.run(projects[projects.length - 1]!.title);
  await expect(page).toHaveURL(`/work/${projects[projects.length - 1]!.slug}`);
  const response = await page.goto("/work/unknown-project");
  expect(response?.status()).toBe(404);
});

test("case studies stay readable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:3100/work/${projects[0]!.slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    projects[0]!.title,
  );
  await page.getByRole("link", { name: "Back to selected work" }).click();
  await expect(page).toHaveURL(/#work$/);
  await context.close();
});

for (const [width, height] of [
  [1920, 1080],
  [1440, 900],
  [768, 1024],
  [430, 932],
  [390, 844],
]) {
  for (const theme of ["paper", "ink"] as const) {
    test(`project visual ${width}×${height} ${theme}`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width: width!, height: height! });
      await page.emulateMedia({
        colorScheme: theme === "ink" ? "dark" : "light",
        reducedMotion: "reduce",
      });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      for (const project of projects) {
        await page.goto(`/work/${project.slug}`);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBeTruthy();
        await page.screenshot({
          path: testInfo.outputPath(`${project.slug}.png`),
          fullPage: true,
        });
      }
      expect(errors).toEqual([]);
    });
  }
}
