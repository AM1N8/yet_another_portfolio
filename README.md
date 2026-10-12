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

## Portfolio terminal

Open **CDXV / TERMINAL** with **Ctrl+`** (or **Ctrl+~**), the desktop `[ >_ ]`button, or the command palette's **TERMINAL** action. Escape,`exit`, the close
button, and the same shortcut close it and restore focus. Outside clicks close
the shell unless an interactive program is running. On mobile, use the palette.

`TerminalLauncher.tsx` loads xterm, its fit addon, terminal CSS and shell code only
on invocation. `/api/terminal` is a static public projection of validated YAML,
requested on opening; it excludes private contact fields, hidden projects and
environment configuration. The homepage remains server-rendered. The virtual
filesystem is read-only and exists entirely in browser memory: `/home/amine`
contains `README.md`, `about.txt`, `contact.txt`, `skills/`, `projects/`, and `lab/`;
`/etc` contains the portfolio hostname and welcome message.

Use `help` for browsing, portfolio, display and navigation commands. `fastfetch`
and `neofetch` show a CDXV ASCII mark and actual public identity, education and
focus. Project paths are clickable; `open <slug>`, `github`, `linkedin` and
`resume` accept only available portfolio destinations. Missing résumé content
gets a concise unavailable message. No command executes code, processes,
network shells or host filesystem operations.

The line editor supports quotes, command/path Tab completion, arrow-key history
and editing, Home/End, Backspace, Ctrl+C and Ctrl+L. Tab completes input;
Shift+Tab reaches Close. `cmatrix` draws bounded green character frames in an
alternate screen, stops with Ctrl+C, pauses in hidden tabs, and renders once
under reduced motion. Closing disposes timers, listeners, observers and xterm.
Unit tests cover filesystem, parsing, commands, privacy, editing and timer
ownership; browser tests cover lazy invocation, focus, completion, navigation,
cleanup and Ink/Paper screenshots at all five review sizes.

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
leads directly into Selected Work; the CDXV point matrix sits in the global footer.

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
This independent utility is retained for snapshot tooling and its existing tests;
the homepage signature does not import it or request GitHub data.

`public/data/github-activity.json` is a versioned, validated public snapshot. Its
initial contents are intentionally empty: no activity measurements were invented.
To replace it with verified API data, run:

```bash
npm run github:snapshot
```

The command uses the configured server environment token when present and writes
only after the entire fetch succeeds, preserving a previous snapshot on failure.
Review the public JSON before committing it. Builds do not require a token or API
availability. The homepage is statically rendered without an API dependency.

## CDXV hero morph

`components/hero/CdxvMorph.tsx` adds a compact cell field to the hero's existing
right column. The name, introduction, metadata, and links retain their existing
layout. On smaller screens, the visual follows the hero metadata.

The imperative renderer in `lib/hero/morph.ts` samples the original CDXV contours
and matches persistent particles between shapes. Inspired by the live Canvas
implementation on [GitHub Innovation Graph](https://innovationgraph.github.com/),
cells carry velocity, attract toward shape targets, and collide locally. The
pointer acts as a moving obstacle: nearby cells push around it and flow back when
it leaves. Positions are simulated rather than interpolated along fixed paths.
C → D → X → V uses a 2.5-second cycle per letter, with a 1.4-second hold and
1.1-second reformation window. Desktop/tablet/mobile use 245/180/140 cells
respectively. Greens are mixed from the existing theme tokens, with soft Paper
tones and muted Ink tones.

The renderer is dynamically imported when visible, caps DPR at 2, and pauses
offscreen or in hidden tabs. Cleanup cancels RAF, removes observers/listeners,
and releases the Canvas bitmap. Frame state stays entirely outside React.
The visual has no visible labels or controls. Clicking or tapping sends a localized
repulsive shockwave from the exact pointer position while the letter cycle keeps
running. Each expanding wave expires after 650ms; at most six are retained, and
contour attraction restores the cells. Enter/Space creates a centered wave;
Escape freezes or resumes the current animation for keyboard accessibility.
Reduced motion, unavailable Canvas, or disabled JavaScript preserves a static
CDXV arrangement. No additional packages are required; spatial-hash collisions
bound the simulation work. Tests cover contour settling, actual cursor and
shockwave displacement/recovery, touch coordinates at DPR 2, continued morphing,
all four held shapes, intermediate clouds, lifecycle, resizing, static fallback,
and both themes.
Browser profiling measures frame callback cost on desktop and with a four-times
CPU slowdown at mobile width; results are attached to the Playwright test report.

## CDXV footer signature

`components/signature/SignatureMark.tsx` renders a purely visual signature inside
the global footer, without a separate homepage section or heading.
`lib/signature/geometry.ts` samples four cut-corner
contours into 670 square cells, preserving a clear CDXV silhouette at every size.
The server renders three compact SVG paths, coordinate guides, a plotting grid,
and a meaningful text description. All geometry is deterministic and represents
the requested signature rather than portfolio statistics.

`SignatureGraph.tsx` is a small client enhancement. It lazily imports the imperative
Canvas renderer only when the field is visible. Pointer movement produces a subtle
local response; the keyboard/touch-accessible Pulse matrix button emphasizes the
center. Reduced motion preserves a static arrangement with immediate color emphasis.
There is no idle animation loop or frame-by-frame React state. Rendering pauses
offscreen or in hidden tabs; cleanup removes observers/listeners, cancels RAF, and
releases the bitmap. The renderer uses Ink/Paper tokens and caps DPR at 2.

The SVG remains complete with JavaScript disabled, unavailable Canvas, or a failed
enhancement import. The footer uses the `#footer-signature` anchor; the legacy YAML
activity section-order slot is ignored. Visibility follows `hero.show_activity_visual`;
GitHub source, credentials, years, and old activity-mode settings have no effect on
this component. Its optional ID supports reuse without SVG-ID collisions.

The obsolete data-driven renderer, mode controls, API browser fixtures, and D3
dependencies were removed. `tests/signature.test.ts` verifies contour integrity,
configuration independence, and renderer lifecycle. Browser tests cover keyboard
and pointer response, theme changes, static fallback, reduced motion, and screenshots
in both themes at all five review sizes.

See `DESIGN.md`, `AGENTS.md`, and `TASKS.md` for the design direction, contribution
rules, and remaining phases.
