import { z } from "zod";
import { GALLERY_TYPES } from "../gallery.ts";

const text = z.string().refine((value) => value.trim().length > 0, {
  message: "Must contain non-whitespace text",
});
const optionalText = z.string().nullish();
const textList = z.array(text).default([]);
const positiveInteger = z.number().int().positive();
const year = z.number().int().min(1000).max(9999);
const slug = text.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a kebab-case slug");
const httpUrl = z.url({ protocol: /^https?$/ });
const localPath = text.regex(/^\/(?!\/)/, "Use a root-relative path");
const resource = z.union([httpUrl, localPath]);
const optionalUrl = z.union([httpUrl, z.literal("")]).nullish();
const optionalResource = z.union([resource, z.literal("")]).nullish();
const date = text.refine(
  (value) => {
    if (
      !/^\d{4}(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12]\d|3[01]))?)?$/.test(value)
    ) {
      return false;
    }
    const fullDate =
      value.length === 4
        ? `${value}-01-01`
        : value.length === 7
          ? `${value}-01`
          : value;
    const parsed = new Date(`${fullDate}T00:00:00Z`);
    return (
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === fullDate
    );
  },
  { message: "Use a valid YYYY, YYYY-MM, or YYYY-MM-DD date" },
);
const optionalDate = z.union([date, z.literal("")]).nullish();

export const linkSchema = z.strictObject({ label: text, url: resource });
const links = z.array(linkSchema).default([]);

export const siteSchema = z.strictObject({
  brand_label: text,
  language: text,
  locale: text,
  canonical_url: httpUrl,
  repository_url: optionalUrl,
  source_visible: z.boolean(),
  default_theme: z.enum(["system", "ink", "paper"]),
  theme_toggle_labels: z.strictObject({ dark: text, light: text }),
  seo: z.strictObject({
    title: text,
    title_template: text,
    description: text,
    keywords: textList,
    og_image: optionalResource,
    twitter_handle: optionalText,
  }),
  analytics: z.strictObject({
    provider: text,
    enabled: z.boolean(),
    website_id: optionalText,
  }),
});

export const identitySchema = z.strictObject({
  full_name: text,
  preferred_name: text,
  initials: text,
  pronouns: optionalText,
  headline: text,
  short_headline: text,
  positioning_statement: text,
  profile_photo: optionalResource,
  logo_text: text,
  location: z.strictObject({
    city: optionalText,
    region: optionalText,
    country: text,
    display: text,
    show_on_site: z.boolean(),
  }),
  timezone: text.refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "Use a valid IANA timezone"),
  show_local_time: z.boolean(),
  availability: z.strictObject({
    status: text,
    detail: optionalText,
    available_from: optionalDate,
    preferred_duration: optionalText,
    preferred_locations: textList,
    remote_ok: z.boolean().nullish(),
    visible: z.boolean(),
  }),
  languages: textList,
});

export const contactSchema = z.strictObject({
  email: z.email(),
  email_public: z.boolean(),
  phone: optionalText,
  phone_public: z.boolean(),
  contact_cta: text,
  links: z.strictObject({
    github: optionalUrl,
    linkedin: optionalUrl,
    x_twitter: optionalUrl,
    bluesky: optionalUrl,
    mastodon: optionalUrl,
    scholar: optionalUrl,
    huggingface: optionalUrl,
    kaggle: optionalUrl,
    devto: optionalUrl,
    medium: optionalUrl,
    personal_blog: optionalUrl,
    other: links,
  }),
  resume: z.strictObject({
    url: optionalResource,
    filename: optionalText,
    label: text,
    visible: z.boolean(),
  }),
});

export const educationEntrySchema = z.strictObject({
  institution: text,
  program: text,
  specialization: optionalText,
  location: optionalText,
  start_date: date,
  end_date: optionalDate,
  expected: z.boolean(),
  current: z.boolean(),
  description: optionalText,
  highlights: textList,
  link: optionalUrl,
  visible: z.boolean(),
});
export const educationSchema = z.strictObject({
  visible: z.boolean(),
  entries: z.array(educationEntrySchema),
});

export const experienceEntrySchema = z.strictObject({
  organization: text,
  role: text,
  location: optionalText,
  type: text,
  start_date: date,
  end_date: optionalDate,
  date_label: optionalText,
  current: z.boolean(),
  summary: text,
  highlights: textList,
  technologies: textList,
  organization_url: optionalUrl,
  visible: z.boolean(),
});
export const experienceSchema = z.strictObject({
  visible: z.boolean(),
  entries: z.array(experienceEntrySchema),
});

export const activityEntrySchema = z.strictObject({
  organization: text,
  organization_type: optionalText,
  role: text,
  location: optionalText,
  start_date: date,
  end_date: optionalDate,
  current: z.boolean(),
  summary: text,
  highlights: textList,
  links,
});
export const activitiesSchema = z.strictObject({
  visible: z.boolean(),
  entries: z.array(activityEntrySchema),
});

export const projectSchema = z.strictObject({
  slug,
  visible: z.boolean(),
  featured: z.boolean(),
  featured_order: positiveInteger.nullish(),
  title: text,
  short_title: optionalText,
  year: year.nullish(),
  status: text,
  role: optionalText,
  team_size: positiveInteger.nullish(),
  domains: textList,
  technologies: textList,
  tags: textList,
  one_liner: text,
  summary: text,
  problem: optionalText,
  why_it_matters: optionalText,
  constraints: textList,
  approach: optionalText,
  architecture: z
    .strictObject({
      summary: optionalText,
      diagram: optionalResource,
      components: textList,
    })
    .nullish(),
  engineering_decisions: textList,
  challenges: textList,
  iterations: textList,
  results: z
    .array(
      z.strictObject({
        label: text,
        value: text,
        context: optionalText,
      }),
    )
    .default([]),
  lessons: optionalText,
  next_steps: optionalText,
  dates: z
    .strictObject({
      start: optionalDate,
      end: optionalDate,
      label: optionalText,
    })
    .nullish(),
  links: z
    .strictObject({
      live_demo: optionalUrl,
      github: optionalUrl,
      paper: optionalUrl,
      article: optionalUrl,
      video: optionalUrl,
      documentation: optionalUrl,
      other: links,
    })
    .nullish(),
  media: z
    .strictObject({
      hero: optionalResource,
      thumbnail: optionalResource,
      gallery: z.array(resource).default([]),
      demo_video: optionalResource,
      architecture_diagram: optionalResource,
    })
    .nullish(),
  interactive_demo: z
    .strictObject({
      enabled: z.boolean(),
      component: optionalText,
      lazy_load: z.boolean(),
      mobile_fallback_image: optionalResource,
    })
    .nullish(),
  activity: z
    .strictObject({
      github_repo: z
        .string()
        .regex(/^[\w.-]+\/[\w.-]+$/)
        .nullish(),
      include_in_activity_graph: z.boolean(),
    })
    .nullish(),
  seo: z.strictObject({ title: text, description: text }).nullish(),
});

export const experimentSchema = z.strictObject({
  slug,
  visible: z.boolean(),
  order: positiveInteger,
  title: text,
  code: text,
  domain: text,
  status: text,
  summary: text,
  technologies: textList,
  preview: optionalResource,
  interactive: z.boolean(),
  component: optionalText,
  github: optionalUrl,
  live_demo: optionalUrl,
});

export const timelineEventSchema = z.strictObject({
  date,
  year,
  type: z.enum([
    "education",
    "experience",
    "award",
    "activity",
    "project",
    "publication",
  ]),
  title: text,
  subtitle: optionalText,
  description: optionalText,
  link: optionalUrl,
  highlighted: z.boolean(),
  visible: z.boolean(),
});
export const timelineSchema = z.strictObject({
  visible: z.boolean(),
  section_label: text,
  events: z.array(timelineEventSchema),
});

export const skillsSchema = z.strictObject({
  visible: z.boolean(),
  section_label: text,
  groups: z.array(z.strictObject({ name: text, items: textList })),
});

export const activityGraphSchema = z.strictObject({
  enabled: z.boolean(),
  source: z.enum(["github", "static"]),
  github_username: text,
  github_token_env: text.regex(
    /^[A-Z][A-Z0-9_]*$/,
    "Use an environment variable name",
  ),
  default_view: z.enum(["activity", "projects", "languages", "timeline"]),
  views: z.strictObject({
    activity: z.boolean(),
    projects: z.boolean(),
    languages: z.boolean(),
    timeline: z.boolean(),
  }),
  appearance: z.strictObject({
    accent_from_theme: z.boolean(),
    node_shape: z.enum(["square", "circle"]),
    show_labels: z.boolean(),
    show_tooltips: z.boolean(),
    show_year_selector: z.boolean(),
  }),
  interaction: z.strictObject({
    pointer_repulsion: z.boolean(),
    project_cluster_morph: z.boolean(),
    hover_details: z.boolean(),
    click_opens_project: z.boolean(),
  }),
  performance: z.strictObject({
    desktop_max_nodes: positiveInteger,
    tablet_max_nodes: positiveInteger,
    mobile_max_nodes: positiveInteger,
    reduced_motion_static: z.boolean(),
    pause_when_offscreen: z.boolean(),
    pause_when_tab_hidden: z.boolean(),
  }),
  fallback: z.strictObject({
    static_data_path: localPath,
    show_if_api_unavailable: z.boolean(),
  }),
});

const homepageSection = z.enum([
  "hero",
  "activity",
  "work",
  "lab",
  "timeline",
  "about",
  "contact",
]);

export const galleryItemSchema = z.strictObject({
  id: slug,
  title: text,
  project_slug: slug.nullish(),
  type: z.enum(GALLERY_TYPES),
  tags: textList,
  date: optionalDate,
  image: resource,
  thumbnail: optionalResource,
  width: positiveInteger,
  height: positiveInteger,
  alt: text,
  caption: optionalText,
  featured: z.boolean().default(false),
  links: z
    .strictObject({
      project: optionalResource,
      github: optionalUrl,
      external: optionalUrl,
    })
    .nullish(),
  visible: z.boolean().default(true),
});
export const gallerySchema = z.strictObject({
  visible: z.boolean(),
  section_number: text,
  title: text,
  description: text,
  items: z.array(galleryItemSchema),
});

export const portfolioSchema = z
  .strictObject({
    site: siteSchema,
    identity: identitySchema,
    contact: contactSchema,
    hero: z.strictObject({
      eyebrow: text,
      role: text,
      statement: text,
      status_label: text,
      show_activity_visual: z.boolean(),
      show_scroll_hint: z.boolean(),
      verbs: textList,
    }),
    about: z.strictObject({
      visible: z.boolean(),
      section_label: text,
      intro: text,
      philosophy: optionalText,
      interests: textList,
      currently_exploring: textList,
      outside_engineering: textList,
    }),
    skills: skillsSchema,
    education: educationSchema,
    experience: experienceSchema,
    activities: activitiesSchema,
    projects: z.strictObject({
      section_label: text,
      entries: z.array(projectSchema),
    }),
    gallery: gallerySchema,
    experiments: z.strictObject({
      visible: z.boolean(),
      section_label: text,
      entries: z.array(experimentSchema),
    }),
    timeline: timelineSchema,
    achievements: z.strictObject({
      visible: z.boolean(),
      entries: z.array(
        z.strictObject({
          title: text,
          issuer: optionalText,
          date: optionalDate,
          description: optionalText,
          link: optionalUrl,
          visible: z.boolean(),
        }),
      ),
    }),
    publications: z.strictObject({
      visible: z.boolean(),
      entries: z.array(
        z.strictObject({
          title: text,
          authors: textList,
          date: optionalDate,
          description: optionalText,
          link: optionalUrl,
          visible: z.boolean(),
        }),
      ),
    }),
    activity_graph: activityGraphSchema,
    navigation: z.strictObject({
      items: z.array(
        z.strictObject({
          label: text,
          href: z.union([resource, text.regex(/^#/)]),
          visible: z.boolean(),
        }),
      ),
    }),
    command_palette: z.strictObject({
      enabled: z.boolean(),
      shortcut: text,
      actions: z.strictObject({
        navigation: z.boolean(),
        projects: z.boolean(),
        experiments: z.boolean(),
        theme_toggle: z.boolean(),
        github: z.boolean(),
        linkedin: z.boolean(),
        resume: z.boolean(),
        copy_email: z.boolean(),
      }),
    }),
    homepage: z.strictObject({
      section_order: z.array(homepageSection),
      selected_project_count: positiveInteger,
      experiment_count: positiveInteger,
      show_education_in_timeline: z.boolean(),
      show_experience_in_timeline: z.boolean(),
    }),
    content_style: z.strictObject({
      tone: textList,
      avoid: textList,
      first_person: z.boolean(),
      preferred_spelling: z.enum(["american", "british"]),
    }),
    ui: z.strictObject({
      section_numbering: z.boolean(),
      show_system_labels: z.boolean(),
      enable_page_transitions: z.boolean(),
      enable_project_hover_previews: z.boolean(),
      theme: z.strictObject({
        accent: text.regex(/^#[\da-fA-F]{6}$/, "Use a six-digit hex color"),
        allow_custom_accent: z.boolean(),
      }),
      motion: z.strictObject({
        enabled: z.boolean(),
        intensity: z.enum(["low", "medium", "high"]),
        respect_reduced_motion: z.boolean(),
      }),
      loading_screen: z.strictObject({
        enabled: z.boolean(),
        first_visit_only: z.boolean(),
        max_visual_duration_ms: z.number().int().nonnegative(),
        never_block_content: z.boolean(),
      }),
    }),
    performance: z.strictObject({
      lcp_target_ms: positiveInteger,
      inp_target_ms: positiveInteger,
      cls_target: z.number().min(0).max(1),
      use_server_components_by_default: z.boolean(),
      lazy_load_activity_graph: z.boolean(),
      lazy_load_experiments: z.boolean(),
      pause_offscreen_animation: z.boolean(),
      disable_heavy_3d_on_mobile: z.boolean(),
      images: z.strictObject({
        preferred_formats: z.array(
          z.enum(["avif", "webp", "png", "jpeg", "svg"]),
        ),
        lazy_load_below_fold: z.boolean(),
        require_dimensions: z.boolean(),
      }),
    }),
    accessibility: z.strictObject({
      reduced_motion: z.boolean(),
      skip_link: z.boolean(),
      visible_focus: z.boolean(),
      keyboard_command_palette: z.boolean(),
      graph_text_fallback: z.boolean(),
      minimum_touch_target_px: positiveInteger,
    }),
    footer: z.strictObject({
      show_copyright: z.boolean(),
      show_build_stack: z.boolean(),
      show_source_link: z.boolean(),
      show_local_time: z.boolean(),
      custom_text: optionalText,
    }),
    ai: z.strictObject({ instructions: text }),
  })
  .superRefine((portfolio, context) => {
    const ids = new Set<string>();
    portfolio.gallery.items.forEach((item, index) => {
      if (ids.has(item.id))
        context.addIssue({
          code: "custom",
          path: ["gallery", "items", index, "id"],
          message: `Duplicate gallery id: ${item.id}`,
        });
      ids.add(item.id);
      if (
        item.project_slug &&
        !portfolio.projects.entries.some(
          (project) => project.slug === item.project_slug,
        )
      )
        context.addIssue({
          code: "custom",
          path: ["gallery", "items", index, "project_slug"],
          message: "Unknown project slug",
        });
    });
    for (const section of ["projects", "experiments"] as const) {
      const seen = new Set<string>();
      portfolio[section].entries.forEach((entry, index) => {
        if (seen.has(entry.slug)) {
          context.addIssue({
            code: "custom",
            path: [section, "entries", index, "slug"],
            message: `Duplicate slug: ${entry.slug}`,
          });
        }
        seen.add(entry.slug);
      });
    }
  });
