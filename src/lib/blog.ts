import * as fs from "node:fs";
import * as path from "node:path";

import matter from "gray-matter";
import { z } from "zod";

import { env } from "@/env";

export const PostMetadataSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.date(),
});

export type PostMetadata = z.infer<typeof PostMetadataSchema>;

export function getPosts() {
  const contentDir = path.join(process.cwd(), "src", "content");
  const files = fs
    .readdirSync(contentDir)
    .filter((file) => env.NODE_ENV === "development" || !path.basename(file).startsWith("_"))
    .filter((file) => path.extname(file) === ".mdx");

  return files.map((file) => {
    const slug = path.basename(file, path.extname(file));
    const parsed = matter.read(path.join(contentDir, file));

    const valid = PostMetadataSchema.safeParse(parsed.data);

    if (!valid.success) {
      throw new Error(`Failed to parse metadata for ${file}`, { cause: valid.error });
    }

    return { slug, metadata: parsed.data as PostMetadata, content: parsed.content };
  });
}

export function getPostBySlug(slug: string) {
  const contentDir = path.join(process.cwd(), "src", "content");
  const file = `${slug}.mdx`;
  const parsed = matter.read(path.join(contentDir, file));

  const valid = PostMetadataSchema.safeParse(parsed.data);

  if (!valid.success) {
    throw new Error(`Failed to parse metadata for ${file}`, { cause: valid.error });
  }

  return { metadata: parsed.data as PostMetadata, content: parsed.content };
}

export function getPostSlugs(): Array<{ slug: string }> {
  const contentDir = path.join(process.cwd(), "src", "content");
  const files = fs
    .readdirSync(contentDir)
    .filter((file) => env.NODE_ENV === "development" || !path.basename(file).startsWith("_"))
    .filter((file) => path.extname(file) === ".mdx");

  return files.map((file) => {
    const slug = path.basename(file, path.extname(file));

    return { slug };
  });
}
