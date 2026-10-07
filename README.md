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
contains a clearly labelled, static reserved Activity Universe field.

`lib/shell.ts` enables section navigation only for rendered sections. Case-study
commands remain disabled, and homepage case-study links are deferred until Phase 6
provides `/work/[slug]`; the corresponding task remains unchecked. Existing
project and experiment repository links work without API integration. Homepage
content and section links remain usable without JavaScript. Browser QA captures
full-page and individual section screenshots for Ink and Paper at all five sizes.

See `DESIGN.md`, `AGENTS.md`, and `TASKS.md` for the design direction, contribution
rules, and remaining phases.
