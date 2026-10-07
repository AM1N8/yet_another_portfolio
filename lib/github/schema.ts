import { z } from "zod";

export const repositoryNameSchema = z.string().regex(/^[\w.-]+\/[\w.-]+$/);
const date = z.iso.date();
const timestamp = z.iso.datetime({ offset: true });
const count = z.number().int().nonnegative();

// The snapshot contains public API observations only, never credentials or raw payloads.
export const githubSnapshotSchema = z
  .object({
    version: z.literal(1),
    username: z.string().regex(/^[\w-]+$/),
    capturedAt: timestamp.nullable(),
    coverage: z
      .object({
        repositoryListTruncated: z.boolean(),
        eventFeedTruncated: z.boolean(),
        contributionCalendar: z.boolean(),
      })
      .strict(),
    repositories: z.array(
      z
        .object({
          fullName: repositoryNameSchema,
          url: z
            .url()
            .refine((value) => value.startsWith("https://github.com/")),
          description: z.string().nullable(),
          primaryLanguage: z.string().nullable(),
          languages: z.record(z.string(), count),
          createdAt: timestamp,
          pushedAt: timestamp.nullable(),
          archived: z.boolean(),
          fork: z.boolean(),
        })
        .strict(),
    ),
    activity: z.array(
      z
        .object({
          id: z.string().min(1),
          type: z.string().min(1),
          repository: repositoryNameSchema,
          occurredAt: timestamp,
        })
        .strict(),
    ),
    contributions: z.array(z.object({ date, count }).strict()),
  })
  .strict();

export type GitHubSnapshot = z.infer<typeof githubSnapshotSchema>;
