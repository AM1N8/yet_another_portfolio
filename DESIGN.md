# AMINE/OS Portfolio — Design & Implementation Specification

> **Purpose:** This file is the source of truth for the visual identity, interaction model, information architecture, component behavior, performance constraints, and implementation quality of the portfolio.
>
> The portfolio must feel like an **interactive AI / research engineering lab**, not a generic developer template, SaaS landing page, or résumé rendered as cards.
>
> All personal content must come from `portfolio.yaml`. Do not hard-code biography, project details, links, dates, metrics, or contact information into React components.

---

## 0. Product Vision

Build a portfolio that feels like a **living technical system**.

The visual direction combines:

- editorial minimalism;
- research-lab / engineering-instrument aesthetics;
- terminal-like microcopy and system status language;
- data visualization;
- restrained motion;
- interactive project demonstrations;
- excellent typography;
- extremely clean spacing;
- very high perceived quality;
- strong performance on desktop **and mobile**.

The visitor should feel as though they are exploring an engineer's laboratory rather than browsing a conventional portfolio.

The interface should communicate:

> "I build intelligent systems, I understand data, and I care about engineering quality."

The experience must remain professional enough for recruiters, research teams, startups, and engineering managers.

---

# 1. Non-Negotiable Design Principles

## 1.1 Do not make a generic developer portfolio

Avoid:

- giant glowing gradient blobs;
- excessive glassmorphism;
- neon cyberpunk styling;
- animated background noise everywhere;
- skill bars such as `Python ███████ 95%`;
- huge grids of technology logos;
- dozens of equal-weight project cards;
- random Three.js scenes unrelated to the work;
- animations on every element;
- generic "Hello, I am..." hero copy;
- excessive rounded cards;
- template-looking Bento grids;
- fake terminal gimmicks that have no useful function.

The website should feel **designed**, not decorated.

## 1.2 One visual language

Every page must use the same underlying system:

- 1px hairline borders;
- strong typography;
- large whitespace;
- compact mono labels;
- one accent color;
- high-contrast surfaces;
- square or subtly rounded geometry;
- measured motion;
- data-inspired visuals.

## 1.3 Interaction must have meaning

Animation should communicate one of:

1. hierarchy;
2. navigation;
3. state change;
4. data transformation;
5. relationship between objects.

Decorative motion is secondary.

## 1.4 Content remains the hero

Interactive visuals should draw attention to real work:

- projects;
- experiments;
- GitHub activity;
- engineering decisions;
- results;
- research interests;
- experience.

---

# 2. Brand Concept

## 2.1 Working identity

Use the interface identity:

`AMINE/OS`

The exact display name must come from `portfolio.yaml`.

`/OS` is a visual metaphor for the website behaving like a personal engineering operating system.

Do **not** overuse the metaphor. It should appear mostly in:

- logo;
- loading state;
- command palette;
- tiny system labels;
- selected section headings;
- live-status widgets.

## 2.2 Personality

The design should feel:

- intelligent;
- calm;
- technical;
- experimental;
- precise;
- slightly unconventional;
- modern;
- trustworthy.

It should **not** feel:

- childish;
- gamer-themed;
- hacker-movie themed;
- corporate;
- overly luxurious;
- chaotic.

---

# 3. Design Tokens

Use CSS variables as the single source of truth.

## 3.1 Light / Paper theme

```css
:root {
  --bg: #f1f0ea;
  --surface: #e9e8e1;
  --surface-elevated: #f7f6f1;
  --text: #141512;
  --text-muted: #6f7069;
  --border: #c9c8bf;
  --border-strong: #999990;
  --accent: #39d353;
  --accent-soft: rgba(57, 211, 83, 0.12);
  --selection: rgba(57, 211, 83, 0.24);
}
```

## 3.2 Dark / Ink theme

```css
[data-theme="ink"] {
  --bg: #0f100e;
  --surface: #151613;
  --surface-elevated: #1a1b18;
  --text: #ecece6;
  --text-muted: #909188;
  --border: #2a2b27;
  --border-strong: #484a43;
  --accent: #49df68;
  --accent-soft: rgba(73, 223, 104, 0.12);
  --selection: rgba(73, 223, 104, 0.24);
}
```

## 3.3 Accent rule

The green accent should occupy **less than ~8% of the visible interface**.

Use it for:

- active navigation;
- active graph nodes;
- live status;
- selected project;
- hover state;
- important numerical data;
- focus rings.

Do not use green for long paragraphs or large background blocks.

## 3.4 Geometry

Preferred radius:

```css
--radius-xs: 2px;
--radius-sm: 5px;
--radius-md: 8px;
```

Most containers should remain closer to rectangular than pill-shaped.

Pills may be used only for:

- compact tags;
- status indicators;
- filters.

## 3.5 Spacing scale

Use a predictable 4px-based spacing system.

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-7: 48px;
--space-8: 64px;
--space-9: 96px;
--space-10: 128px;
```

Major desktop sections should generally use **96–160px** vertical spacing.

Do not compress the page merely to show more content.

---

# 4. Typography

Typography is one of the most important elements of the design.

## 4.1 Font pairing

Recommended:

- Display/body: `Geist`, `Inter`, or another high-quality neutral grotesk.
- Technical labels/code: `Geist Mono` or `IBM Plex Mono`.

Prefer variable fonts.

Use `next/font` or local optimized fonts.

Never request more font weights than necessary.

Recommended weights:

- regular 400;
- medium 500;
- semibold 600.

## 4.2 Type scale

Desktop reference:

```text
Hero name            clamp(4rem, 9vw, 9rem)
Hero descriptor      16–20px
Section title         clamp(2.6rem, 5vw, 5.5rem)
Project title         clamp(2rem, 4vw, 4rem)
Body large            20–24px
Body                  16–18px
UI / labels           11–13px
Micro labels          10–11px
```

Use tight display leading around `0.92–1.02`.

Body text should remain comfortable around `1.5–1.65`.

Do not render important descriptive text below 14px.

## 4.3 Label convention

Technical labels can use:

```text
03 / SELECTED WORK
LAB / 002
STATUS / ACTIVE
DOMAIN / COMPUTER VISION
UPDATED / OCT 2026
```

Use uppercase monospace sparingly.

---

# 5. Grid & Layout

## 5.1 Desktop grid

Use a 12-column layout.

Recommended maximum content width:

`1440px`

Page horizontal padding:

```text
>= 1440px: 48–72px
1024–1439px: 32–48px
768–1023px: 24–32px
< 768px: 18–20px
```

## 5.2 Alignment

Prefer alignment lines across sections.

Navigation, hero text, section indices, case-study content, and footer should visually share anchor lines.

## 5.3 Responsive philosophy

Do not merely shrink the desktop design.

At mobile sizes:

- reduce simultaneous information;
- replace complex multi-column graphs with focused views;
- disable unnecessary physics;
- make project visuals swipeable or horizontally scrollable where appropriate;
- preserve typography hierarchy;
- keep minimum tap target ~44px;
- prefer content over ornamental visuals.

---

# 6. Global Information Architecture

Primary navigation:

```text
HOME
WORK
LAB
TIMELINE
ABOUT
CONTACT
```

Optional:

```text
ACTIVITY
```

Navigation should be compact, sticky on desktop, and transform into a clean mobile menu.

Also support a command palette:

`Ctrl/Cmd + K`

Command palette actions:

```text
Open project
Open experiment
Navigate to section
Toggle Ink / Paper
Open GitHub
Open LinkedIn
Open résumé
Copy email
```

All actions must be keyboard accessible.

---

# 7. Homepage

The homepage should feel like one continuous interactive editorial composition.

Recommended progression:

```text
Hero
↓
Interactive activity visualization
↓
Selected work
↓
Lab / experiments
↓
Timeline
↓
About / principles
↓
Contact
```

---

# 8. Hero Section

## 8.1 Composition

Desktop hero should occupy approximately `90–100svh`.

Left side:

- name;
- role;
- 1–2 sentence positioning statement;
- current status;
- location;
- primary links.

Right / central region:

- interactive activity field or particle visualization.

Tiny UI metadata can sit on outer edges.

Example spatial concept:

```text
┌─────────────────────────────────────────────────────────────┐
│ AMINE/OS          01 HOME  02 WORK  03 LAB       INK ○     │
│                                                             │
│ AMINE                 ·  ▪ ▪▪                               │
│ DARRAJ              ▪ ▪▪▪▪  ▪                              │
│                   ▪▪▪▪▪▪▪▪▪        / ACTIVITY              │
│ AI ENGINEER       ▪▪▪▪▪▪▪▪         / PROJECTS              │
│ / RESEARCHER        ▪▪▪▪▪           / EXPERIMENTS           │
│                                                             │
│ I build systems that see, reason, learn and act.             │
│                                                             │
│ ● CURRENTLY                                                  │
│   [status from YAML]                               ↓ SCROLL  │
└─────────────────────────────────────────────────────────────┘
```

## 8.2 Activity field

The hero visual should use a lightweight canvas or SVG visualization.

Behavior:

- low motion at idle;
- nodes subtly react to pointer proximity;
- maximum displacement constrained;
- no continuous expensive spring simulation;
- reduced-motion mode becomes static;
- mobile uses a simplified static / low-density version.

The hero visualization should transition conceptually into the Activity section.

## 8.3 Theme toggle

Use the labels:

`INK` / `PAPER`

Remember the preference in local storage.

Respect `prefers-color-scheme` on first visit.

---

# 9. Loading Experience

Do not block first render with an artificial long loader.

The loader is allowed only when it reflects **real app initialization** and must remain brief.

Visual concept:

```text
LOADING AMINE/OS

[██████████████████░░] 91%

MODULES
✓ portfolio
✓ projects
✓ experiments
✓ github
○ interface
```

Implementation rule:

- initial HTML content must remain available;
- loader should not delay LCP;
- no arbitrary 2–5 second setTimeout;
- first-time animation may run as an overlay while useful content is already rendered;
- repeat visits should skip or drastically shorten it.

---

# 10. Activity / GitHub Visualization

This is one of the portfolio's signature components.

## 10.1 Modes

Tabs:

```text
ACTIVITY
PROJECTS
LANGUAGES
TIMELINE
```

### Activity mode

A contribution-like chronological matrix.

Hover displays:

```text
12 OCT 2026
8 contributions
Ghost Grid XO
Computer Vision / AR
VIEW DETAILS →
```

### Projects mode

Nodes transform into clustered groups.

Each cluster = project.

Possible encoding:

- cluster size → amount of work;
- node intensity → recent activity;
- distance → conceptual similarity;
- label → project title/domain.

### Languages mode

Same data field reorganizes into language clusters.

### Timeline mode

Nodes arrange chronologically and reveal project periods.

## 10.2 Technology choice

Preferred rendering:

- D3 for scales, layouts, transforms, data utilities;
- Canvas for hundreds/thousands of animated cells;
- SVG for labels, axes, focus rings, and simple diagrams.

Do **not** render thousands of individually animated React DOM nodes.

## 10.3 Data

Production data should be preprocessed server-side.

Never expose GitHub secrets in browser JavaScript.

Support a static fallback JSON generated at build time.

If API loading fails, the visualization must still render fallback data.

## 10.4 Performance

Target:

- desktop visualization: smooth 60fps on typical hardware;
- mobile visualization: ~30–60fps with reduced node count;
- stop animation when tab is backgrounded;
- stop expensive loops when visualization leaves viewport;
- debounce resize work;
- avoid React state updates on every animation frame;
- move expensive particle calculations to a Web Worker only if profiling demonstrates the need.

---

# 11. Selected Work

Do not present every project equally.

Feature **3–5 strongest projects**.

Each selected project section should feel editorial.

Desktop structure example:

```text
03 / SELECTED WORK

GHOST GRID XO                                 2026
Machine perception for physical interfaces.

[large project visual / interactive preview]

Computer Vision    Android    AR
OpenCV             Geometry   Realtime

Physical board → camera → perception → game state.

VIEW CASE STUDY ↗
```

Use alternating layouts only when they improve composition.

Do not use a repetitive 3-column card grid for primary projects.

---

# 12. Project Case Study Page

A project page should prove engineering thinking.

Recommended structure:

```text
Project header
Problem
Why it matters
Constraints
System architecture
Technical approach
Interactive demo / visual
Key engineering decisions
Evaluation / metrics
Challenges / failures
Iterations
Results
Stack
Links
What I would improve next
Related experiments
```

## 12.1 Hero

Include:

- project title;
- one-line purpose;
- status;
- year;
- role;
- collaborators if any;
- relevant links;
- high-quality visual.

## 12.2 Architecture diagrams

Prefer clean system diagrams over screenshots of code.

Use consistent visual vocabulary:

```text
INPUT → PROCESS → MODEL → SERVICE → UI
```

## 12.3 Technical depth

Case studies should explain **why**, not just **what**.

For example:

Bad:

> Used OpenCV for detection.

Better:

> Classical line detection initially produced unstable intersections under perspective and textured backgrounds, so the pipeline moved toward normalized planar geometry and temporal stabilization.

## 12.4 Code snippets

Only show code when it communicates an interesting decision.

Code blocks should be short.

---

# 13. LAB / Experiments

Purpose: show curiosity and breadth without diluting primary projects.

Visual design:

```text
LAB / 001
GHOST GRID TRACKING
CV / AR
[interactive visual]
RUN →

LAB / 002
GRAPH RAG EXPLORER
KNOWLEDGE SYSTEMS
RUN →
```

Experiment cards may form a 2-column desktop grid.

Each experiment should support:

- title;
- domain;
- status;
- preview;
- optional live demo;
- repository;
- short explanation.

The "RUN" action should genuinely do something when possible.

---

# 14. Timeline

Use a vertical technical log.

Example:

```text
2027 ── ● PFE
         AI / ML / Systems

2026 ── ● Engineering / AI
         Education, internship, projects

2024 ── ● Engineering cycle

2022 ── ● Foundation
```

On scroll, highlight the current timeline segment.

No dramatic parallax is necessary.

---

# 15. About Section

Keep it concise.

Use two columns on desktop:

Left:

- personal positioning statement;
- what kinds of problems are interesting;
- work philosophy.

Right:

```text
FOCUS
AI systems
Machine learning
Computer vision
Intelligent interfaces

CURRENTLY EXPLORING
[...]

LOCATION
[...]

LANGUAGES
[...]
```

Avoid autobiographical walls of text.

---

# 16. Skills / Technology Presentation

Do not use percentage proficiency.

Group tools semantically.

Suggested groups:

```text
INTELLIGENCE
PyTorch
scikit-learn
Transformers
LLM/RAG stack

PERCEPTION
OpenCV
Vision models
AR tooling

DATA
PostgreSQL
Neo4j
FAISS
DuckDB

SYSTEMS
FastAPI
Docker
Linux
Git

INTERFACES
React
Next.js
Android
Visualization
```

Data must come from YAML.

---

# 17. Contact

Keep the ending extremely clean.

Example:

```text
07 / CONTACT

Have an interesting problem?

LET'S TALK ↗

email@example.com

GitHub
LinkedIn
Résumé
```

Optionally include a tiny command line:

```text
> contact amine
```

Do not require a contact form unless it provides real value.

If a contact form exists:

- server-side validation;
- spam protection;
- accessible errors;
- no unnecessary fields.

---

# 18. Footer

Minimal.

Possible fields:

```text
© YEAR NAME
BUILT WITH NEXT.JS
SOURCE ↗
INK / PAPER
LOCAL TIME
```

Avoid clutter.

---

# 19. Interaction & Motion System

## 19.1 Default reveal

Use restrained section reveals:

```text
opacity: 0 → 1
transform: translateY(10px) → 0
duration: 300–450ms
```

## 19.2 Important morphs

Use richer animation for:

- activity mode transformations;
- project visualization transitions;
- opening case studies;
- command palette;
- theme switch;
- experiment interactions.

## 19.3 Motion rules

Avoid:

- large scroll hijacking;
- fake inertial scrolling;
- excessive stagger;
- looping 3D scenes;
- cursor trails;
- pointer replacement;
- large parallax backgrounds.

## 19.4 Reduced motion

Support:

```css
@media (prefers-reduced-motion: reduce)
```

Disable:

- particle movement;
- morph transitions;
- spring animations;
- continuous decorative loops.

Never remove content.

---

# 20. Cursor & Hover States

Use the normal OS cursor.

Do not replace it with a custom circle.

Hover states can include:

- accent border;
- subtle background shift;
- node expansion;
- underline motion;
- metadata reveal.

Hover animations should generally complete in under 200ms.

---

# 21. Sound

Default: **no sound**.

If sound is ever added to a specific experiment:

- user must explicitly activate it;
- provide visible mute control;
- remember mute preference.

---

# 22. Images & Media

Use high-quality visuals.

Preferred hierarchy:

1. interactive demo;
2. real project screenshot;
3. system diagram;
4. short compressed video;
5. static illustration.

Avoid generic stock images.

All non-decorative images need descriptive alt text.

Use modern formats such as AVIF/WebP when appropriate.

Videos:

- no autoplay with sound;
- lazy load;
- provide poster;
- compressed aggressively;
- pause when offscreen.

---

# 23. Implementation Architecture

Recommended:

```text
Next.js
├── App Router
├── TypeScript
├── React Server Components by default
├── Tailwind CSS or CSS Modules
├── Framer Motion only where useful
├── D3 for visualization logic
├── Canvas/SVG for data visuals
├── MDX for long case-study narrative if required
└── portfolio.yaml as content source
```

## 23.1 React rule

Use Server Components unless client interactivity is genuinely required.

Add `"use client"` only around:

- activity visualization;
- command palette;
- theme controls;
- interactive demos;
- small animated components.

Do not turn the entire page into a Client Component.

## 23.2 Data flow

```text
portfolio.yaml
      │
      ▼
schema validation
      │
      ▼
typed portfolio object
      │
      ├── homepage
      ├── projects
      ├── experiments
      ├── timeline
      ├── SEO
      └── JSON-LD
```

Validate YAML at build time.

Recommended validation:

`zod`

Build should fail with a useful error when required content is malformed.

---

# 24. Suggested Project Structure

```text
portfolio/
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   ├── work/
│   │   └── [slug]/
│   │       └── page.tsx
│   ├── lab/
│   ├── api/
│   │   └── github/
│   └── globals.css
│
├── components/
│   ├── layout/
│   ├── navigation/
│   ├── hero/
│   ├── activity/
│   ├── work/
│   ├── lab/
│   ├── timeline/
│   ├── command/
│   └── ui/
│
├── lib/
│   ├── content.ts
│   ├── github.ts
│   ├── schema.ts
│   ├── analytics.ts
│   └── utils.ts
│
├── public/
│   ├── images/
│   ├── projects/
│   └── fonts/
│
├── content/
│   └── portfolio.yaml
│
└── DESIGN.md
```

---

# 25. Performance Is a Design Requirement

The website must **look expensive without being expensive to render**.

Performance should be treated as a product feature.

## 25.1 Target budgets

Aim for:

```text
LCP        < 2.0s on a good mid-range mobile connection
CLS        < 0.05
INP        < 200ms
Initial JS as small as practical
Homepage 3D dependency: ideally 0 KB
60fps for normal UI transitions
```

These are internal project goals, not reasons to compromise usability.

## 25.2 JavaScript

Rules:

- server-render as much as possible;
- code-split visualizations;
- dynamically import heavy interactive experiments;
- do not load D3 visualization code before the visualization approaches the viewport when possible;
- do not ship Three.js unless a real 3D experience justifies it;
- avoid huge animation libraries if CSS can do the job;
- tree-shake imports;
- avoid giant icon libraries.

## 25.3 Activity graph

Canvas render loop must not trigger React renders.

Use refs and imperative drawing for frame-level animation.

Pause with:

- `IntersectionObserver`;
- `document.visibilityState`.

Consider adaptive node count:

```text
high-end desktop: full density
normal desktop: full/medium density
tablet: medium density
mobile: low density
reduced-motion: static
```

## 25.4 Fonts

- preload only primary fonts;
- subset where possible;
- use `font-display: swap`;
- avoid 8 separate weight files.

## 25.5 Images

- explicit dimensions;
- responsive `sizes`;
- no giant source images for small thumbnails;
- lazy load below fold;
- hero media must be carefully prioritized.

## 25.6 Third-party scripts

Keep them minimal.

Analytics must not block rendering.

No unnecessary chat widgets, trackers, or social embeds.

---

# 26. Accessibility

Minimum requirements:

- semantic landmarks;
- logical heading structure;
- keyboard navigation;
- visible focus indicators;
- WCAG-friendly contrast;
- skip-to-content link;
- reduced motion;
- screen-reader labels for icon-only controls;
- interactive graph also has an accessible textual representation;
- dialogs trap and restore focus correctly;
- minimum touch target around 44px;
- do not encode meaning by color alone.

The activity graph must offer an alternative accessible list/table of the same important information.

---

# 27. SEO & Metadata

Generate from `portfolio.yaml`:

- title;
- description;
- canonical URL;
- Open Graph;
- Twitter/X card;
- author metadata;
- favicon;
- sitemap;
- robots file.

Add structured data when applicable:

```text
Person
WebSite
CreativeWork / SoftwareSourceCode for projects
```

Do not fabricate awards, employment, dates, or credentials.

---

# 28. Content Rules for AI

When generating the site from `portfolio.yaml`:

1. Never invent personal data.
2. Never invent project metrics.
3. Never invent company names.
4. Never invent dates.
5. Never claim a project is deployed when it is not.
6. Never turn empty YAML fields into fictional copy.
7. If optional content is empty, omit the UI element.
8. Preserve the tone requested in YAML.
9. Prioritize featured projects.
10. Keep prose concise and specific.

---

# 29. Content Hierarchy

Information priority:

```text
1. Identity
2. Technical positioning
3. Strongest projects
4. Evidence / results
5. Engineering thinking
6. Experience
7. Experiments
8. Skills
9. Personal context
10. Contact
```

Do not give equal visual weight to everything.

---

# 30. Quality Bar

Before considering the site finished, verify:

### Visual

- spacing is consistent;
- type hierarchy is strong;
- alignment is deliberate;
- accent color is restrained;
- mobile design is intentional;
- no section looks like an off-the-shelf component library.

### Interaction

- command palette works;
- theme switch works;
- activity visualization is smooth;
- interactions have keyboard equivalents;
- reduced motion works;
- empty/loading/error states exist.

### Content

- no placeholder text;
- no fake statistics;
- project copy explains impact and engineering;
- links work;
- dates are consistent.

### Engineering

- TypeScript strict mode;
- no avoidable hydration errors;
- no secrets client-side;
- YAML schema validated;
- Lighthouse/performance profiling performed;
- no console errors;
- no oversized media;
- mobile tested on real viewport sizes.

---

# 31. AI Build Instruction

When an AI coding agent receives this repository, it should follow this priority order:

```text
1. Read DESIGN.md completely.
2. Read portfolio.yaml completely.
3. Validate portfolio.yaml.
4. Build semantic content structure.
5. Implement typography and grid.
6. Implement responsive layout.
7. Implement selected work and project pages.
8. Implement activity visualization.
9. Add motion.
10. Optimize performance.
11. Test accessibility.
12. Polish micro-interactions.
```

Do not start by building animations.

The site must already look excellent **with JavaScript disabled wherever practical**.

---

# 32. Final Creative Direction

The target feeling is:

> **Editorial research lab × developer tool × data visualization.**

A visitor should remember:

- the typography;
- the activity universe;
- the project demos;
- the precision of the layout;
- the feeling that the site is alive.

The portfolio should not communicate:

> "I know how to use fancy frontend libraries."

It should communicate:

> **"I am an engineer who understands systems, data, interfaces, and details."**
