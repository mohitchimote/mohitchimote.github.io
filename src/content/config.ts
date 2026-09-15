import { defineCollection, z } from 'astro:content';

const aiFeature = z.object({
  title: z.string(),
  description: z.string(),
});

const screenshot = z.object({
  src: z.string(),
  alt: z.string(),
  caption: z.string().optional(),
  placeholder: z.boolean().optional(),
});

const codeSnippet = z.object({
  file: z.string(),
  lang: z.string(),
  code: z.string(),
  repoUrl: z.string().url().optional(),
});

const diagram = z.object({
  svg: z.string(),
  caption: z.string().optional(),
});

const work = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    order: z.number(),
    status: z.enum(['live', 'poc', 'built']),
    statusLabel: z.string().optional(),
    statusNote: z.string().optional(),
    summary: z.string(),
    users: z.string(),
    role: z.string(),
    problem: z.string(),
    architecture: z.string(),
    outcome: z.string(),
    stack: z.array(z.string()),
    aiFeatures: z.array(aiFeature).optional(),
    diagram: diagram.optional(),
    codeSnippet: codeSnippet.optional(),
    screenshots: z.array(screenshot).default([]),
    links: z.object({
      live: z.string().url().optional(),
      repo: z.string().url().optional(),
      repos: z.array(z.object({ label: z.string(), url: z.string().url() })).optional(),
    }),
  }),
});

export const collections = { work };
