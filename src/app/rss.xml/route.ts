import { Feed } from "feed";
import { cacheLife } from "next/cache";

import { env } from "@/env";
import { getPosts } from "@/lib/blog";

// Caches the XML rather than the Response: `use cache` stores the return value,
// and a Response isn't serializable. The feed only changes when posts do, i.e.
// on deploy, and caching also keeps the new Date() below from opting the route
// out of prerendering.
async function renderFeed(): Promise<string> {
  "use cache";
  cacheLife("max");

  const posts = getPosts()
    .filter(({ slug }) => !slug.startsWith("_"))
    .sort(
      ({ metadata: { pubDate: a } }, { metadata: { pubDate: b } }) => b.valueOf() - a.valueOf(),
    );

  const feed = new Feed({
    title: "Ray Arayilakath",
    description: "Essays and technical notes from Ray!",
    id: env.NEXT_PUBLIC_APP_URL,
    link: env.NEXT_PUBLIC_APP_URL,
    language: "en",
    image: "https://github.com/rayhanadev.png",
    favicon: `${env.NEXT_PUBLIC_APP_URL}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, Rayhan Noufal Arayilakath`,
    updated: posts[0]?.metadata.pubDate,
    feedLinks: {
      rss: `${env.NEXT_PUBLIC_APP_URL}/rss.xml`,
    },
    author: {
      name: "Rayhan Noufal Arayilakath",
      link: env.NEXT_PUBLIC_APP_URL,
    },
  });

  for (const { slug, metadata } of posts) {
    const postUrl = `${env.NEXT_PUBLIC_APP_URL}/blog/${slug}`;

    feed.addItem({
      title: metadata.title,
      id: postUrl,
      link: postUrl,
      description: metadata.description,
      date: metadata.pubDate,
      published: metadata.pubDate,
      author: [
        {
          name: "Rayhan Noufal Arayilakath",
          link: env.NEXT_PUBLIC_APP_URL,
        },
      ],
    });
  }

  return feed.rss2();
}

export async function GET() {
  return new Response(await renderFeed(), {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Vercel-CDN-Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
