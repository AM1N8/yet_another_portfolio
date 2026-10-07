# Portfolio foundation

Next.js App Router with strict TypeScript and a server-only, validated content layer.
Use Node.js 22.18+ and npm.

```bash
npm install
npm run dev
```

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run format:check
```

`npm test` runs unit tests and Chromium browser tests against a production build.
Install the browser once with `npx playwright install chromium` (or
`npx playwright install --with-deps chromium` when system libraries are needed).
Use `npm run test:unit` or `npm run test:e2e` to run either suite separately.
Browser screenshots for both themes at all five review sizes are written to
`test-results/`; failure traces are retained there too.

## Content

`content/portfolio.yaml` is the only personal-content source. The flow is:

```text
portfolio.yaml → YAML parser → Zod schema → inferred Portfolio → Server Components
```

Server Components import `loadPortfolio` from `lib/content/loadPortfolio.ts`.
Import types from `lib/content/types.ts` using `import type`; do not parse YAML in
components or import the loader into Client Components. The `server-only` guard
enforces that boundary. ESLint also prohibits YAML parser imports in `app/` and
`components/`.

The root layout loads the content during prerendering, so invalid required fields
fail production builds with the filename and field paths. YAML syntax errors also
include parser diagnostics. Optional fields accept missing/null values, optional
text and links may be empty, and optional lists default to empty arrays. No missing
personal facts are generated. Unknown keys and duplicate project/experiment slugs
are rejected. External URLs must use HTTP(S); media and résumé resources may also
use root-relative paths. Dates accept valid `YYYY`, `YYYY-MM`, or `YYYY-MM-DD` values.

## Design system and shell

`app/globals.css` contains the Ink/Paper tokens, spacing scale, typography utilities,
responsive gutters, and 4/8/12-column grid. Use `.container`, `.grid`, `.col-4`,
`.col-6`, `.col-8`, `.col-full`, `.section`, and `.stack` for shared alignment and
rhythm. Type utilities are `.display`, `.section-title`, `.project-title`, `.body`,
`.body-large`, `.mono`, and `.label`. Geist and Geist Mono use `next/font`; only the
primary font is preloaded. The original muted palette is preserved with a slightly
stronger `--text-muted-readable` variant for small text contrast.

The theme initialization script applies the saved or OS theme before paint.
`lib/theme.ts` synchronizes header/footer controls, follows OS changes while in
system mode, and persists explicit choices in `portfolio-theme`. The command
palette includes an action to return to system mode. CSS handles the OS theme
even with JavaScript disabled.

The root layout, header, and footer remain Server Components. Small client leaves
handle theme controls, the local clock, current-route navigation, the mobile
disclosure, and the native-dialog command palette. The palette supports search,
arrow keys, Enter, Escape, Cmd/Ctrl+K, focus trapping/restoration, theme actions,
configured social links, experiment links, and public-email copy with a fallback.
Résumé and source actions are omitted when their URLs are missing.

## Static homepage

Phase 4 adds server-rendered Hero, Selected Work, LAB, Timeline, About, Stack, and
Contact sections. `lib/homepage.ts` applies the YAML section order, visibility
flags, featured ordering, configured counts, and public-contact rules. Stack
follows the About slot independently of About visibility. `app/homepage.css`
contains the editorial homepage layouts; components live in `components/home/`.

Selected Work uses only visible featured projects. Missing project media falls
back to the supplied architecture component lists, without inventing screenshots
or connections between components. Results retain their exact YAML values and
context. Empty optional content and unavailable actions are omitted. The hero
contains a static coordinate field linking to the Activity Universe section.

`lib/shell.ts` enables section navigation only for rendered sections and project
navigation only for visible projects. Homepage case-study links and command-palette
project actions navigate to `/work/[slug]`. Existing project and experiment
repository links work without API integration. Homepage
content and section links remain usable without JavaScript. Browser QA captures
full-page and individual section screenshots for Ink and Paper at all five sizes.

## Project case studies

`app/work/[slug]/page.tsx` statically generates every visible YAML project, including
non-featured projects, and returns 404 for unknown slugs. Project-specific titles,
descriptions, canonical URLs, Open Graph, and Twitter metadata use validated content.

`components/work/CaseStudy.tsx` shares the editorial layout and conditionally renders
narrative, architecture, results, lessons, links, and media. Empty sections disappear.
`ArchitectureDiagram.tsx` uses lightweight HTML/SVG component registers without
inventing connections. Images use `next/image`; videos have native controls and do
not autoplay. All case-study content remains server-rendered. Route-local styling
preserves the homepage design and supports Ink/Paper and reduced motion.

Project browser tests cover metadata, conditional content, navigation, 404 behavior,
JavaScript-disabled rendering, and screenshots of all projects at the five review
sizes in both themes.

## GitHub activity data

`lib/github/loadGitHubData.ts` exports the server-only `loadGitHubData()` loader.
It reads the username, source, token environment-variable name, and fallback path
from validated YAML. Public repositories, language byte counts, and recent public
events work without a token. An optional server-only `GITHUB_TOKEN` also enables
the GitHub contribution calendar. Public events are explicitly separate from
contribution counts: the REST feed is limited and is not a complete activity history.

Requests revalidate hourly and use bounded pagination, timeouts, and language-query
concurrency. Coverage flags expose truncation and calendar availability. API errors,
rate limits, and invalid responses select the validated static fallback, or return
an empty dataset when fallback is unavailable/disabled. Error messages and tokens
are never serialized. Import types from `lib/github/types.ts`; server loaders must
not be imported by Client Components.

Normalization produces repository/project associations, chronological events and
contributions, language shares by observed bytes, timeline entries, and graph-ready
nodes without layout coordinates. Known repositories map to visible, opted-in YAML
projects case-insensitively; unknown repositories remain generic GitHub activity.
The homepage Activity Universe consumes this normalized data on the server.

`public/data/github-activity.json` is a versioned, validated public snapshot. Its
initial contents are intentionally empty: no activity measurements were invented.
To replace it with verified API data, run:

```bash
npm run github:snapshot
```

The command uses the configured server environment token when present and writes
only after the entire fetch succeeds, preserving a previous snapshot on failure.
Review the public JSON before committing it. Builds do not require a token or API
availability. The homepage is statically rendered and revalidates hourly.

## Activity Universe core

`components/activity/ActivitySection.tsx` passes public normalized data to a small
client visualization and server-renders the complete text alternative. The homepage
awaits its cached data before rendering, so the text view remains visible without
JavaScript instead of depending on a streamed Suspense replacement.

`lib/activity/layout.ts` uses focused D3 scale, time, and grouping modules for four
deterministic views: calendar-style ACTIVITY, PROJECTS clusters, LANGUAGES clusters,
and chronological TIMELINE lanes with supplied project periods. Calendar totals
remain unattributed unless the source actually identifies a repository. Language
groups use repository primary language; byte shares are labelled separately in the
text view. Filled nodes and outlined nodes distinguish contributions from events.

`lib/activity/renderer.ts` owns current/target coordinates, hit testing, and 420ms
interpolation in an imperative Canvas renderer. Frames never update React state;
the loop stops after settling and cleanup cancels pending frames. Canvas sizing
tracks its container and device pixel ratio. Theme tokens, responsive node limits,
and reduced-motion static rendering are supported. Controls, cluster links,
tooltips, year selection, and complete keyboard-accessible records use HTML; project
period markers use SVG. Empty/API-failure and unavailable-Canvas states retain
project links and the text alternative. Optional pointer repulsion is not enabled.

Browser tests exercise populated fixtures and the committed empty fallback in
separate `.next-browser*` build/cache directories. `tests/fixtures/github-api.mjs`
replaces only the server GitHub transport during these test builds; it never writes
fixture activity into the public snapshot or production cache. Screenshots cover
all four modes, both themes, and the five required viewport sizes.

### Activity performance

`LazyActivity.tsx` imports the visualization (including D3) only within 100px of
the viewport and while the document is visible. Its reserved region and the
server-rendered text alternative are available before that chunk loads. The
statically generated, hourly-revalidated homepage does not wait for graph
JavaScript to paint the hero. Project routes do not import the visualization.

An IntersectionObserver and document visibility listener suspend the renderer.
Suspension cancels RAF, defers Canvas/layout updates, and retains only the latest
pending target. Resume continues from current coordinates. Settled and
reduced-motion layouts have no animation loop. ResizeObserver work is debounced
100ms and measured on resume; DPR changes retain sharp rendering. Cleanup removes
all observers/listeners/timers, cancels frames, and releases the Canvas bitmap.
Deterministic node sampling caps desktop/tablet/mobile at the YAML limits
(1800/1000/550); the accessible text view retains every record.

`tests/browser/activity-performance.spec.ts` profiles 1440px desktop and 390px
mobile (4× CPU slowdown) against the production test build. It records LCP,
long tasks, Canvas frame callback cost, post-GC heap growth, resize draw counts,
and deferred chunk requests in `test-results/.../performance.json`. It verifies
zero draws offscreen, hidden, after unmount, and at rest with reduced motion.
Run in isolation for less noisy measurements:

```bash
npx playwright test tests/browser/activity-performance.spec.ts --workers=1
```

These are local Chromium lab checks with a 160-record fixture, not field Web
Vitals. Density cap tests additionally exercise 2400 input nodes. Initial lab
profiling showed sub-1.3ms graph frame callbacks at 4× CPU slowdown and under
0.6MB retained heap growth after repeated mode changes. A Worker is not justified
by this workload; pointer repulsion remains disabled.

See `DESIGN.md`, `AGENTS.md`, and `TASKS.md` for the design direction, contribution
rules, and remaining phases.
