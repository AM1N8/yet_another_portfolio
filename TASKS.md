# TASKS.md — Portfolio Build Plan

This file defines the implementation sequence for the portfolio.

The phases are ordered intentionally.

Do not skip directly to advanced animation or the Activity Universe before the static site, content layer, and visual system are stable.

Each phase includes a quality gate. Complete the gate before moving forward.

---

# PHASE 0 — Repository Foundation

## 0.1 Bootstrap

- [x] Create or verify a Next.js App Router project.
- [x] Enable TypeScript strict mode.
- [x] Configure ESLint.
- [x] Add formatting setup if needed.
- [x] Create canonical project folders.
- [x] Place the filled YAML at `content/portfolio.yaml`.
- [x] Ensure `DESIGN.md`, `AGENTS.md`, and `TASKS.md` are at repo root.

Target structure:

```text
app/
components/
content/
lib/
public/
DESIGN.md
AGENTS.md
TASKS.md
```

## Quality gate

- [x] Dev server runs.
- [x] Production build succeeds.
- [x] No unnecessary dependencies are installed.

Suggested commit:

```text
chore: initialize portfolio foundation
```

---

# PHASE 1 — Typed Content Layer

## 1.1 YAML loader

- [x] Install a lightweight YAML parser.
- [x] Create one server-side loader for `content/portfolio.yaml`.
- [x] Prevent components from parsing YAML directly.

## 1.2 Zod schema

- [x] Create schema for site metadata.
- [x] Create identity/contact schema.
- [x] Create education schema.
- [x] Create experience schema.
- [x] Create activity schema.
- [x] Create project schema.
- [x] Create experiment schema.
- [x] Create timeline schema.
- [x] Create skills schema.
- [x] Create Activity Universe config schema.
- [x] Handle nullable and optional values properly.

## 1.3 Types

- [x] Export inferred TypeScript types.
- [x] Provide useful build-time validation errors.
- [x] Ensure current `portfolio.yaml` validates successfully.

## Quality gate

- [x] Invalid required content fails clearly.
- [x] Valid YAML produces a typed object.
- [x] No personal content is duplicated in React files.
- [x] Typecheck succeeds.

Suggested commit:

```text
feat: add validated portfolio content layer
```

---

# PHASE 2 — Global Design System

Do not add elaborate motion yet.

## 2.1 Tokens

- [x] Implement Ink/Paper CSS variables from `DESIGN.md`.
- [x] Implement spacing scale.
- [x] Implement border/radius tokens.
- [x] Implement text colors.
- [x] Implement restrained accent usage.

## 2.2 Typography

- [x] Add optimized primary font.
- [x] Add optimized mono font.
- [x] Configure display/body/mono classes.
- [x] Implement responsive typography using `clamp()` where appropriate.

## 2.3 Grid

- [x] Implement global max width.
- [x] Implement desktop 12-column grid utilities.
- [x] Implement responsive page gutters.
- [x] Establish consistent vertical section spacing.

## 2.4 Theme

- [x] Implement system theme detection.
- [x] Implement `INK / PAPER` toggle.
- [x] Persist explicit preference.
- [x] Avoid theme flash/hydration mismatch.

## Quality gate

- [x] Ink theme works.
- [x] Paper theme works.
- [x] Mobile gutters look intentional.
- [x] Theme toggle is keyboard accessible.
- [x] Static content does not require a large client wrapper.

Suggested commit:

```text
feat: establish portfolio design system
```

---

# PHASE 3 — Application Shell

## 3.1 Layout

- [x] Root layout.
- [x] Header.
- [x] Desktop navigation.
- [x] Mobile navigation.
- [x] Footer.
- [x] Skip-to-content link.

## 3.2 Command palette

- [x] Add `Cmd/Ctrl + K`.
- [ ] Support section navigation.
- [ ] Support project navigation.
- [x] Support experiment navigation.
- [x] Support theme toggle.
- [x] Support GitHub.
- [x] Support LinkedIn.
- [x] Support email copy.
- [x] Support résumé action only when URL exists.

## Quality gate

- [x] Full keyboard navigation works.
- [x] Mobile menu works.
- [x] No broken internal links.
- [x] Command palette restores focus correctly.

Suggested commit:

```text
feat: add responsive application shell
```

---

# PHASE 4 — Homepage Static Content

The homepage should already look good at the end of this phase without the Activity Universe.

## 4.1 Hero

- [x] Render name from YAML.
- [x] Render role.
- [x] Render positioning statement.
- [x] Render availability status.
- [x] Render location.
- [x] Render public GitHub/LinkedIn/contact links.
- [x] Create reserved visual region for Activity Universe.
- [x] Add scroll hint.
- [x] Add restrained technical/system labels.

Do not implement complex particles yet.

## 4.2 Selected Work

- [x] Sort by `featured_order`.
- [x] Show only featured projects on homepage.
- [x] Create editorial project layout.
- [x] Avoid generic 3-column card grid.
- [x] Include domain/technology metadata.
- [x] Include verified metrics when useful.
- [ ] Link to project case-study routes.

## 4.3 LAB

- [x] Render experiment entries.
- [x] Use compact experimental/research styling.
- [x] Hide unavailable actions.
- [x] Support GitHub links.

## 4.4 Timeline

- [x] Render YAML timeline.
- [x] Implement clean vertical log.
- [x] Highlight significant entries.
- [x] Keep mobile layout readable.

## 4.5 About / Stack

- [x] Render concise intro.
- [x] Render philosophy.
- [x] Render interests.
- [x] Render semantic skill groups.
- [x] Never use proficiency percentages.

## 4.6 Contact

- [x] Render CTA.
- [x] Render email.
- [x] Render public links.
- [x] Respect privacy visibility fields.
- [x] Keep phone hidden when `phone_public: false`.

## Quality gate

- [x] All homepage content comes from YAML.
- [x] Empty fields disappear gracefully.
- [x] No project facts are invented.
- [x] Homepage remains understandable with minimal JavaScript.
- [x] Mobile has no horizontal overflow.

Suggested commit:

```text
feat: build static portfolio homepage
```

---

# PHASE 5 — First Visual Review

Perform a dedicated visual pass before adding complex interactions.

Review at:

```text
1920 × 1080
1440 × 900
768 × 1024
430 × 932
390 × 844
```

Improve:

- [x] typography;
- [x] hero composition;
- [x] whitespace;
- [x] section rhythm;
- [x] grid alignment;
- [x] project hierarchy;
- [x] borders;
- [x] hover states;
- [x] mobile composition;
- [x] Ink/Paper cohesion.

Do not add the Activity Universe yet.

## Quality gate

- [x] Homepage looks intentional at all target widths.
- [x] No generic template-looking sections.
- [x] No unnecessary gradients/glassmorphism.
- [x] The static portfolio already feels premium.

Suggested commit:

```text
style: complete first visual refinement pass
```

---

# PHASE 6 — Project Case Study System

## 6.1 Dynamic routing

- [x] Create `/work/[slug]`.
- [x] Generate routes from visible YAML projects.
- [x] Handle missing slug with 404.
- [x] Add project-specific SEO metadata.

## 6.2 Case study composition

For each project, render when available:

- [x] title;
- [x] one-liner;
- [x] status;
- [x] year;
- [x] role;
- [x] technologies;
- [x] problem;
- [x] why it matters;
- [x] constraints;
- [x] approach;
- [x] architecture;
- [x] engineering decisions;
- [x] challenges;
- [x] iterations;
- [x] results;
- [x] lessons;
- [x] next steps;
- [x] project links;
- [x] media.

## 6.3 Empty-data behavior

- [x] Do not show headings for empty sections.
- [x] Do not render `N/A`.
- [x] Do not generate placeholder copy.

## 6.4 Architecture visual

- [x] Create reusable architecture-diagram component.
- [x] Use lightweight HTML/SVG.
- [x] Use YAML component lists when possible.
- [x] Keep visual style consistent across projects.

## Quality gate

- [x] All visible project pages render.
- [x] No fake project details.
- [x] Project metadata is internally consistent.
- [x] Project pages are responsive.
- [x] Long-form pages remain readable.

Suggested commit:

```text
feat: add data-driven project case studies
```

---

# PHASE 7 — Project Page Visual Review

Review at least the strongest featured projects.

Improve:

- [ ] project hero composition;
- [ ] technical metadata presentation;
- [ ] architecture diagram styling;
- [ ] long-form readability;
- [ ] results/metrics presentation;
- [ ] media framing;
- [ ] mobile case-study layout;
- [ ] spacing between technical and editorial content.

Avoid turning every subsection into a card.

## Quality gate

- [ ] Strongest projects feel distinct and memorable.
- [ ] Case studies remain easy to scan.
- [ ] No performance-heavy decoration is introduced.

Suggested commit:

```text
style: refine project case-study visual system
```

---

# PHASE 8 — GitHub Data Layer

Do not build the visualization before the data layer is stable.

## 8.1 Data types

Create normalized internal types for:

- [x] contribution/activity entries;
- [x] project/repository associations;
- [x] language distribution;
- [x] timeline activity;
- [x] graph nodes.

## 8.2 Server GitHub integration

- [x] Read `github_username` from YAML.
- [x] Read token from server-only environment variable.
- [x] Never expose token to client bundle.
- [x] Add server-side fetch.
- [x] Add caching/revalidation.
- [x] Handle API rate/error states.

## 8.3 Fallback

- [x] Support `/public/data/github-activity.json`.
- [x] Use fallback if API unavailable.
- [x] Ensure site can build without private token.

## 8.4 Data normalization

- [x] Normalize GitHub data into graph-friendly shape.
- [x] Map known repositories to portfolio projects.
- [x] Preserve unknown repositories as generic activity where useful.

## Quality gate

- [x] Production build works without leaking secrets.
- [x] Graph data can be inspected in normalized form.
- [x] Fallback works when API is unavailable.

Suggested commit:

```text
feat: add resilient github activity data pipeline
```

---

# PHASE 9 — Activity Universe Core

This is the most technically demanding phase.

## 9.1 Renderer foundation

- [x] Create Canvas renderer.
- [x] Keep frame state outside React state.
- [x] Use `requestAnimationFrame`.
- [x] Support device pixel ratio correctly.
- [x] Handle resize.
- [x] Handle responsive node density.

## 9.2 Node model

Each node should support enough data for:

- [x] date/activity;
- [x] project association;
- [x] language;
- [x] intensity;
- [x] current layout position;
- [x] target position;
- [x] hover metadata.

## 9.3 ACTIVITY mode

- [x] Chronological contribution-style arrangement.
- [x] Year controls where useful.
- [x] Activity intensity.
- [x] Hover details.

## 9.4 PROJECTS mode

- [x] Cluster nodes by project.
- [x] Label major clusters.
- [x] Support click-through to project.
- [x] Unknown activity handled gracefully.

## 9.5 LANGUAGES mode

- [x] Reorganize by language.
- [x] Preserve continuity during transitions.
- [x] Show useful labels.

## 9.6 TIMELINE mode

- [x] Arrange graph chronologically.
- [x] Highlight major project periods.
- [x] Keep labels readable.

## 9.7 Transitions

- [x] Nodes animate toward targets.
- [x] Do not use React setState per frame.
- [x] Keep transition duration restrained.
- [x] Avoid expensive physics when interpolation works.

## 9.8 Pointer interaction

- [x] Hover node.
- [ ] Optional constrained pointer repulsion.
- [x] Tooltip.
- [x] Project navigation.
- [x] Keyboard-accessible alternative interaction.

## Quality gate

- [x] All four modes work.
- [x] Repeated switching is stable.
- [x] No obvious memory leak.
- [x] No React-render-per-frame pattern.
- [x] Desktop interaction feels smooth.

Suggested commit:

```text
feat: implement activity universe visualization
```

---

# PHASE 10 — Activity Universe Performance

## 10.1 Lifecycle

- [x] Pause render loop when offscreen.
- [x] Pause when document is hidden.
- [x] Resume correctly.
- [x] Clean up listeners and RAF.

## 10.2 Adaptive density

- [x] Desktop density.
- [x] Tablet density.
- [x] Mobile density.
- [x] Reduced-motion static layout.

Suggested maximums from YAML:

```text
desktop: 1800
tablet: 1000
mobile: 550
```

## 10.3 Loading

- [x] Lazy-load visualization code.
- [x] Keep hero/content render independent.
- [x] Do not delay LCP for graph JavaScript.

## 10.4 Profiling

- [x] Check main-thread behavior.
- [x] Check memory.
- [x] Check resize behavior.
- [x] Check mobile performance.
- [x] Consider a Web Worker only if profiling proves it useful.

## Quality gate

- [x] No graph work while hidden.
- [x] Mobile remains responsive.
- [x] Reduced-motion mode has no continuous animation.

Suggested commit:

```text
perf: optimize activity universe lifecycle and rendering
```

---

# PHASE 11 — Activity Universe Visual Review

Do not rewrite stable rendering architecture merely for styling.

Refine:

- [ ] node size;
- [ ] node density;
- [ ] cluster spacing;
- [ ] label typography;
- [ ] tooltip composition;
- [ ] selected states;
- [ ] transition feel;
- [ ] graph-to-page integration;
- [ ] Ink/Paper treatment;
- [ ] mobile simplification.

Preserve:

- Canvas rendering;
- performance;
- mobile fallback;
- reduced-motion behavior;
- accessibility.

## Quality gate

- [ ] Activity Universe feels like part of the design system.
- [ ] It does not visually overpower the portfolio.
- [ ] The graph remains smooth after visual refinement.

Suggested commit:

```text
style: refine activity universe visual system
```

---

# PHASE 12 — Experiments / LAB Polish

## 12.1 Structure

- [ ] Ensure LAB data remains reusable.
- [ ] Add detail pages only if useful.
- [ ] Lazy-load future interactive experiments.
- [ ] Keep empty preview fields graceful.

## 12.2 Visual distinction

- [ ] Make LAB visually distinct from Selected Work.
- [ ] Preserve research/experimental aesthetic.
- [ ] Avoid generic cards.
- [ ] Keep experiments secondary to flagship projects.

## Quality gate

- [ ] LAB feels intentional.
- [ ] Experiments do not dominate primary projects.

---

# PHASE 13 — Motion System

Add motion only after layout is mature.

## 13.1 Base motion

- [ ] Add restrained section reveals.
- [ ] Add theme transition.
- [ ] Add command palette transition.
- [ ] Add project-page transition only where useful.
- [ ] Implement `prefers-reduced-motion`.

## 13.2 Review motion quality

- [ ] Remove excessive motion.
- [ ] Tune easing.
- [ ] Tune duration.
- [ ] Ensure motion does not block interaction.
- [ ] Ensure no decorative loop runs unnecessarily.

## Quality gate

- [ ] Page does not feel busy.
- [ ] Motion has clear purpose.
- [ ] Reduced motion is complete.

---

# PHASE 14 — SEO / Metadata

- [ ] Root metadata from YAML.
- [ ] Per-project metadata.
- [ ] Canonical URLs.
- [ ] Open Graph.
- [ ] Sitemap.
- [ ] Robots.
- [ ] JSON-LD Person.
- [ ] JSON-LD WebSite.
- [ ] Appropriate project structured data.
- [ ] Favicon/app icons.

## Quality gate

- [ ] No fabricated structured data.
- [ ] Social metadata uses correct public information.
- [ ] Project pages have useful titles/descriptions.

---

# PHASE 15 — Accessibility Audit

- [ ] Keyboard-only navigation.
- [ ] Focus order.
- [ ] Visible focus.
- [ ] Mobile menu focus handling.
- [ ] Command palette focus trap.
- [ ] Graph text fallback.
- [ ] Alt text.
- [ ] Heading hierarchy.
- [ ] Landmark structure.
- [ ] Contrast.
- [ ] Reduced motion.
- [ ] Touch targets.
- [ ] Screen-reader labels.

## Quality gate

- [ ] Entire site is usable without a mouse.
- [ ] Graph information is available without Canvas interaction.
- [ ] No critical accessibility issue remains.

Suggested commit:

```text
a11y: complete portfolio accessibility pass
```

---

# PHASE 16 — Performance Audit

Check:

- [ ] LCP.
- [ ] CLS.
- [ ] INP.
- [ ] JavaScript bundle size.
- [ ] fonts.
- [ ] image sizes.
- [ ] graph lazy loading.
- [ ] client component boundaries.
- [ ] third-party scripts.
- [ ] hydration.
- [ ] unused dependencies.

Targets:

```text
LCP < 2.0s
INP < 200ms
CLS < 0.05
```

Do not sacrifice visual identity for negligible micro-optimizations.

Suggested commit:

```text
perf: complete production performance audit
```

---

# PHASE 17 — Final Visual Audit

Review screenshots at:

```text
1920 × 1080
1440 × 900
768 × 1024
430 × 932
390 × 844
```

Review both Ink and Paper themes.

Evaluate:

- [ ] hero balance;
- [ ] typography;
- [ ] section rhythm;
- [ ] page density;
- [ ] borders;
- [ ] project visual hierarchy;
- [ ] Activity Universe;
- [ ] mobile composition;
- [ ] footer;
- [ ] contact section.

Ask:

> What can be removed to make the design stronger?

## Quality gate

- [ ] No generic template-looking sections.
- [ ] No unnecessary visual effects.
- [ ] Both themes feel intentionally designed.
- [ ] Homepage has a distinctive identity.

Suggested commit:

```text
style: complete final portfolio visual audit
```

---

# PHASE 18 — Final Engineering Audit

Inspect the entire repository.

Review:

- [ ] unnecessary client components;
- [ ] duplicate CSS;
- [ ] hydration issues;
- [ ] graph lifecycle;
- [ ] memory leaks;
- [ ] TypeScript quality;
- [ ] dead code;
- [ ] unused dependencies;
- [ ] broken routes;
- [ ] broken links;
- [ ] YAML validation;
- [ ] SEO;
- [ ] accessibility;
- [ ] performance;
- [ ] mobile overflow;
- [ ] production environment assumptions.

Run:

```bash
npm run lint
npm run typecheck
npm run build
```

If tests exist:

```bash
npm test
```

## Quality gate

- [ ] All checks pass.
- [ ] No production console errors.
- [ ] No exposed secrets.
- [ ] No placeholder content.
- [ ] No fabricated portfolio facts.

Suggested commit:

```text
chore: production readiness audit
```

---

# PHASE 19 — Deployment

- [ ] Configure Vercel project.
- [ ] Add server-only GitHub token if used.
- [ ] Verify environment variable names.
- [ ] Verify production canonical domain.
- [ ] Update `site.canonical_url` if needed.
- [ ] Verify HTTPS.
- [ ] Verify social preview.
- [ ] Verify project routes.
- [ ] Verify sitemap.
- [ ] Verify fallback GitHub data.
- [ ] Verify production mobile build.

---

# FINAL DEFINITION OF DONE

The portfolio is complete when:

- [ ] `DESIGN.md` is faithfully implemented.
- [ ] `portfolio.yaml` is the only personal-content source.
- [ ] Selected projects are visually dominant.
- [ ] Activity Universe is memorable and smooth.
- [ ] The site feels like an interactive engineering lab.
- [ ] Visual review has been performed using real screenshots.
- [ ] Mobile experience is intentional.
- [ ] Ink and Paper themes are polished.
- [ ] Accessibility is built in.
- [ ] Performance targets are reasonably met.
- [ ] `npm run lint` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] There are no fake metrics or invented claims.
- [ ] Production deployment works.

---

# RECOMMENDED EXECUTION STRATEGY

Work phase by phase.

After each quality gate:

1. run validation commands;
2. inspect the result in the browser;
3. create a Git checkpoint;
4. move to the next phase.

For major visual changes:

1. inspect screenshots first;
2. make focused changes;
3. compare before/after;
4. verify that performance and accessibility have not regressed.

For major engineering changes:

1. preserve existing visual behavior unless intentionally changing it;
2. keep diffs focused;
3. profile rather than guessing;
4. avoid introducing dependencies without clear value.

The key rule is:

> **Build the structure first, make it beautiful second, make the signature interaction third, then audit everything before deployment.**
