import { Feed } from "feed";

import { env } from "@/env";
import { getPosts } from "@/lib/blog";

export const dynamic = "force-static";
export const revalidate = false;

export function GET() {
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

  return new Response(feed.rss2(), {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Vercel-CDN-Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
