import type { MetadataRoute } from "next";
import { cacheLife } from "next/cache";

import { env } from "@/env";
import { getPostSlugs } from "@/lib/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Same as the feed: cached so lastModified doesn't force a dynamic render.
  "use cache";
  cacheLife("max");

  const slugs = getPostSlugs();

  return [
    {
      url: `${env.NEXT_PUBLIC_APP_URL}`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 1,
    },
    ...slugs.map(
      (s) =>
        ({
          url: `${env.NEXT_PUBLIC_APP_URL}/blog/${s.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.8,
        }) satisfies MetadataRoute.Sitemap[0],
    ),
  ];
}
