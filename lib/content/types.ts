import type { z } from "zod";
import type {
  activityEntrySchema,
  activityGraphSchema,
  contactSchema,
  educationEntrySchema,
  experimentSchema,
  experienceEntrySchema,
  identitySchema,
  linkSchema,
  portfolioSchema,
  projectSchema,
  siteSchema,
  skillsSchema,
  timelineEventSchema,
  galleryItemSchema,
} from "./schema.ts";

export type Portfolio = z.infer<typeof portfolioSchema>;
export type Site = z.infer<typeof siteSchema>;
export type Identity = z.infer<typeof identitySchema>;
export type Contact = z.infer<typeof contactSchema>;
export type EducationEntry = z.infer<typeof educationEntrySchema>;
export type ExperienceEntry = z.infer<typeof experienceEntrySchema>;
export type ActivityEntry = z.infer<typeof activityEntrySchema>;
export type Project = z.infer<typeof projectSchema>;
export type Experiment = z.infer<typeof experimentSchema>;
export type TimelineEvent = z.infer<typeof timelineEventSchema>;
export type Skills = z.infer<typeof skillsSchema>;
export type ActivityGraphConfig = z.infer<typeof activityGraphSchema>;
export type ContentLink = z.infer<typeof linkSchema>;
export type GalleryItem = z.infer<typeof galleryItemSchema>;
