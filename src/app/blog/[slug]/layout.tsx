import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { env } from "@/env";
import { getPostBySlug, getPostSlugs } from "@/lib/blog";

const AUTHOR = "Rayhan Noufal Arayilakath";
const SITE_NAME = "Ray Arayilakath";
const X_HANDLE = "@rayhanadev";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!getPostSlugs().some((entry) => entry.slug === slug)) {
    notFound();
  }

  const { metadata } = getPostBySlug(slug);
  const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const postUrl = `${baseUrl}/blog/${slug}`;
  const title = `${metadata.title} | ${SITE_NAME}`;
  const publishedTime = metadata.pubDate.toISOString();

  return {
    title,
    description: metadata.description,
    authors: [{ name: AUTHOR, url: baseUrl }],
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      title,
      description: metadata.description,
      url: postUrl,
      siteName: SITE_NAME,
      type: "article",
      publishedTime,
      authors: [AUTHOR],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: metadata.description,
      creator: X_HANDLE,
    },
  };
}

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}

export function generateStaticParams() {
  return getPostSlugs();
}
