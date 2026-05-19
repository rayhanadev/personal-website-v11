import type { MetadataRoute } from "next";

import { env } from "@/env";
import { getPostSlugs } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
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
          url: `${env.NEXT_PUBLIC_APP_URL}/blog/${s}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.8,
        }) satisfies MetadataRoute.Sitemap[0],
    ),
  ];
}
