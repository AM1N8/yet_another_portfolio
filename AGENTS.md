# AGENTS.md — Portfolio Repository Rules

This file defines the operating rules for any coding agent, AI assistant, or human contributor working on this portfolio.

The goal is to preserve a consistent product vision, strong engineering quality, excellent performance, accurate content, and a coherent visual identity throughout the project.

---

# 0. Mandatory Read Order

Before changing code, read:

1. `DESIGN.md`
2. `content/portfolio.yaml`
3. `AGENTS.md`
4. `TASKS.md`
5. The relevant existing source files

Do not begin implementation from a prompt alone.

---

# 1. Sources of Truth

## Visual / UX source of truth

`DESIGN.md`

It defines:

- visual direction;
- layout;
- typography;
- spacing;
- interaction;
- motion;
- responsive behavior;
- Activity Universe behavior;
- accessibility expectations;
- performance expectations;
- case-study structure.

If implementation conflicts with `DESIGN.md`, the implementation is wrong.

Do not reinterpret the project as a generic developer portfolio.

---

## Content source of truth

`content/portfolio.yaml`

It defines:

- identity;
- contact information;
- education;
- experience;
- projects;
- project metrics;
- activities;
- experiments;
- timeline;
- links;
- skills;
- GitHub account;
- SEO content.

Never invent facts.

Never fabricate:

- dates;
- metrics;
- technologies;
- links;
- awards;
- roles;
- companies;
- publications;
- deployment status;
- project results.

If optional content is `null`, empty, or missing, omit the corresponding UI where appropriate.

---

# 2. Product Goal

The site must feel like:

> **Editorial research lab × developer tool × data visualization**

It should feel like an engineer's interactive technical environment, not a résumé rendered as cards.

The visitor should remember:

- typography;
- precision;
- project presentation;
- the Activity Universe;
- useful interaction;
- excellent responsiveness;
- fast performance.

---

# 3. Core Engineering Principles

Prefer:

- correctness;
- simple architecture;
- maintainability;
- progressive enhancement;
- accessibility;
- performance;
- explicit data flow;
- stable abstractions;
- small focused components.

Avoid:

- premature complexity;
- unnecessary client-side state;
- speculative abstractions;
- duplicated data;
- large dependencies for small effects;
- hidden magic;
- excessive indirection.

---

# 4. Architecture Rules

Use:

- Next.js App Router;
- TypeScript strict mode;
- React Server Components by default;
- Zod for content validation;
- YAML as the personal-content source;
- CSS variables for design tokens;
- D3 for visualization math/layout;
- Canvas for dense animated nodes;
- SVG/HTML for labels and accessible overlays.

Avoid unnecessary dependencies.

Do not introduce without clear justification:

- Three.js;
- React Three Fiber;
- Redux/Zustand/global state;
- large component libraries;
- heavy animation libraries;
- a CMS;
- backend services unrelated to portfolio requirements.

---

# 5. React Rules

Default to Server Components.

Use `"use client"` only for:

- theme controls;
- command palette;
- Activity Universe;
- interactive experiments;
- browser APIs;
- necessary animation logic.

Prefer:

```text
Server Component
└── small Client Component
```

Avoid:

```text
entire page as Client Component
```

Never move static content into client state unnecessarily.

Do not use effects when derived rendering or server-side logic would be simpler.

---

# 6. Content Architecture

All portfolio content must flow through one validated layer.

Preferred flow:

```text
content/portfolio.yaml
        ↓
YAML parser
        ↓
Zod schema
        ↓
typed Portfolio object
        ↓
UI
```

Recommended files:

```text
lib/content/schema.ts
lib/content/loadPortfolio.ts
lib/content/types.ts
```

Do not parse YAML independently inside multiple components.

Build should fail with a useful validation error if required content is invalid.

---

# 7. Visual Identity Rules

Preserve:

- strong editorial typography;
- mono technical labels;
- warm paper / dark ink theme;
- restrained green accent;
- thin borders;
- large whitespace;
- precise alignment;
- low-radius geometry;
- technical metadata;
- meaningful motion;
- data visualization.

Avoid:

- glassmorphism;
- glowing gradient backgrounds;
- cyberpunk aesthetics;
- generic SaaS layouts;
- excessive rounded cards;
- stock UI-kit appearance;
- giant icon clouds;
- skill percentages;
- fake terminals;
- custom cursors;
- scroll hijacking;
- excessive parallax;
- gratuitous 3D.

The accent color should remain visually rare.

---

# 8. Typography Rules

Typography is a major design feature.

Use a high-quality grotesk + monospace pairing.

Recommended:

```text
Primary: Geist / Inter
Mono: Geist Mono / IBM Plex Mono
```

Do not use more font weights than needed.

Maintain strong hierarchy.

Do not shrink important content merely to fit more information.

Use responsive type with `clamp()` where appropriate.

---

# 9. Layout Rules

Use a consistent responsive grid.

Recommended:

- desktop: 12-column layout;
- max content width around 1440px;
- deliberate shared alignment lines;
- generous vertical section spacing;
- responsive page gutters;
- mobile layouts designed separately rather than merely scaled down.

Avoid horizontal overflow.

Do not compress sections just to fit more content above the fold.

---

# 10. Motion Rules

Motion must communicate:

- state;
- hierarchy;
- navigation;
- data transformation;
- relationships.

Normal transitions should be restrained.

Good default:

```text
opacity: 0 → 1
translateY: 10px → 0
duration: ~300–450ms
```

Reserve richer motion for:

- Activity Universe transformations;
- project transitions;
- theme transitions;
- command palette;
- interactive demos.

Respect:

```css
prefers-reduced-motion
```

Reduced-motion mode must preserve content and usability.

Avoid:

- scroll hijacking;
- cursor trails;
- long artificial loaders;
- constant decorative loops;
- large uncontrolled spring systems.

---

# 11. Activity Universe Rules

The Activity Universe is the signature technical interaction.

Required views:

```text
ACTIVITY
PROJECTS
LANGUAGES
TIMELINE
```

Architecture:

```text
GitHub / fallback data
        ↓
normalization
        ↓
D3 layout logic
        ↓
Canvas node renderer
        ↓
HTML/SVG labels + controls
```

Do not render hundreds/thousands of animated React nodes.

Animation frame logic must not call React state setters every frame.

Use refs and imperative Canvas rendering.

Must support:

- hover;
- project clustering;
- language clustering;
- timeline arrangement;
- year filtering where applicable;
- static fallback;
- reduced-motion fallback;
- accessible text representation;
- mobile simplification.

---

# 12. GitHub Data Rules

Never expose a GitHub token client-side.

Use server-only environment variables.

Example:

```text
GITHUB_TOKEN
```

Prefer:

- server-side fetch;
- cache/revalidation;
- normalized data;
- build/static fallback.

The site must remain usable when GitHub API requests fail.

Do not make deployment depend on a private token unless absolutely necessary.

---

# 13. Performance Rules

Performance is a product feature.

Target:

```text
LCP < 2.0s
INP < 200ms
CLS < 0.05
```

Rules:

- server render where possible;
- minimize JavaScript;
- lazy-load heavy visualization code;
- dynamically import interactive experiments;
- avoid shipping D3 to routes that do not need it;
- no Three.js unless justified;
- optimize fonts;
- use AVIF/WebP where appropriate;
- provide explicit image dimensions;
- pause Canvas animation offscreen;
- pause animation when the tab is hidden;
- use adaptive node counts.

Activity graph guidance:

```text
desktop: full density
tablet: medium density
mobile: reduced density
reduced motion: static
```

Do not optimize based on intuition alone when profiling is possible.

---

# 14. Accessibility Rules

Required:

- semantic landmarks;
- correct heading hierarchy;
- visible focus states;
- keyboard navigation;
- command palette keyboard support;
- accessible dialogs;
- touch targets around 44px;
- sufficient contrast;
- skip link;
- reduced motion;
- meaningful alt text;
- accessible graph fallback.

Do not encode information using color alone.

The site should remain understandable even if Canvas fails to render.

---

# 15. Responsive Rules

Mobile is not a shrunk desktop.

On mobile:

- reduce simultaneous information;
- simplify graph density;
- preserve hierarchy;
- maintain generous spacing;
- avoid tiny labels;
- ensure controls are reachable;
- avoid horizontal overflow;
- disable expensive decorative effects;
- prioritize project content.

Test at minimum:

```text
390 × 844
430 × 932
768 × 1024
1440 × 900
1920 × 1080
```

---

# 16. Project Case Study Rules

Project pages should explain engineering thinking, not just list technologies.

Render sections only when data exists.

Preferred structure:

```text
Project header
Problem
Why it matters
Constraints
Approach
Architecture
Engineering decisions
Challenges
Iterations
Results
Lessons
Next steps
Links
Media
```

Do not show empty headings.

Do not display `N/A`.

Do not invent missing narrative.

Prefer diagrams and concise explanations over walls of code.

---

# 17. SEO Rules

Generate metadata from YAML.

Implement:

- page title;
- meta description;
- Open Graph metadata;
- canonical URL;
- sitemap;
- robots;
- project page metadata;
- JSON-LD where appropriate.

Possible structured types:

```text
Person
WebSite
CreativeWork
SoftwareSourceCode
```

Do not fabricate structured-data claims.

---

# 18. Visual Review Rules

Whenever performing a visual refinement pass:

1. Read `DESIGN.md`.
2. Inspect the existing implementation.
3. Preserve working architecture unless a change is justified.
4. Preserve accessibility.
5. Preserve performance.
6. Compare actual rendered screenshots, not only source code.
7. Improve only things that materially enhance the design.

Focus on:

- typography;
- vertical rhythm;
- whitespace;
- proportions;
- grid alignment;
- section transitions;
- mobile composition;
- hover states;
- graph aesthetics;
- project visual hierarchy.

After a major visual pass, review for:

- unnecessary client bundle growth;
- hydration issues;
- accessibility regressions;
- performance regressions;
- duplicated CSS;
- unnecessary dependencies.

---

# 19. Screenshot Review

For visual QA, inspect at least:

```text
1920 × 1080
1440 × 900
768 × 1024
430 × 932
390 × 844
```

Evaluate:

- hero balance;
- typography;
- section rhythm;
- whitespace;
- alignment;
- project hierarchy;
- Activity Universe;
- Ink theme;
- Paper theme;
- mobile composition;
- footer/contact balance.

Always ask:

> What can be removed to make the design stronger?

---

# 20. Dependency Rule

Before adding a package, ask:

1. Can native CSS/React/browser APIs handle it?
2. Is the dependency maintained?
3. What does it cost in bundle size?
4. Does it require client-side execution?
5. Is it used in more than one meaningful place?
6. Does it make the product materially better?

Avoid adding packages for trivial effects.

---

# 21. Code Quality

Required:

- TypeScript strict;
- descriptive names;
- small focused components;
- minimal prop drilling;
- no duplicated content constants;
- no unexplained magic numbers;
- no `any` unless strongly justified;
- no ignored TypeScript errors;
- no commented dead code;
- no production console errors.

Use comments for **why**, not for restating obvious code.

---

# 22. Error & Empty States

Handle gracefully:

- GitHub API failure;
- missing optional content;
- missing project media;
- unavailable demo;
- empty experiment list;
- broken external link data;
- graph fallback mode.

Do not let a missing optional field break a page.

---

# 23. Testing / Validation Commands

Before considering a meaningful task finished, run the available equivalents of:

```bash
npm run lint
npm run typecheck
npm run build
```

If tests exist:

```bash
npm test
```

Do not mark a task complete while the build is broken.

---

# 24. Git Discipline

Create small logical commits.

Suggested patterns:

```text
feat: add typed portfolio content loader
feat: implement selected work section
feat: add activity canvas renderer
style: refine homepage typography
perf: pause activity graph offscreen
fix: resolve mobile project layout overflow
```

Create checkpoint commits before major experiments or redesigns.

---

# 25. Things Agents Must Never Do

Never:

- invent résumé content;
- change project metrics;
- expose secrets;
- silently replace YAML with hard-coded personal data;
- rewrite the visual direction into a generic template;
- install heavy packages without need;
- turn the whole app into client-side React;
- introduce an artificial loading delay;
- make the Activity Universe inaccessible;
- ignore reduced motion;
- trade major performance for decoration;
- remove working content merely because a screenshot looks cleaner;
- hide build errors instead of fixing them.

---

# 26. Definition of Done

A feature is done only when:

- it matches `DESIGN.md`;
- it uses `portfolio.yaml` correctly;
- it is responsive;
- it is keyboard accessible;
- it works in Ink and Paper themes where relevant;
- it handles missing optional data;
- it has no obvious performance issue;
- lint/typecheck/build pass;
- it introduces no production console errors.

---

# 27. Priority Order

When goals conflict, prioritize:

```text
1. Correctness
2. Content accuracy
3. Accessibility
4. Performance
5. Visual hierarchy
6. Maintainability
7. Animation / decoration
```

The site should look exceptional because its design is precise, not because it contains the most effects.
