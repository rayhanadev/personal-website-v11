import Image from "next/image";

import BlogFancybox from "@/components/BlogFancybox";
import Link from "@/components/Link";
import SubscribeForm from "@/components/SubscribeForm";
import { getPostBySlug } from "@/lib/blog";

const postDateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});

export default async function Page({
  params,
}: Readonly<{
  params: Promise<{ slug: string }>;
}>) {
  const { slug } = await params;

  const { default: Post } = await import(`@/content/${slug}.mdx`);
  const { metadata } = getPostBySlug(slug);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto mt-16 flex w-full max-w-2xl flex-1 flex-col gap-10 px-4 pb-16 focus:outline-none sm:mt-39 sm:gap-12 sm:px-0"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-4xl leading-none text-balance sm:text-5xl">
            {metadata.title}
          </h1>
          <p className="text-neutral-500">{metadata.description}</p>
        </div>
        <div className="flex flex-row items-center gap-2">
          <div className="relative size-11 overflow-hidden rounded-full">
            <Image
              alt="Ray's profile picture"
              src="https://github.com/rayhanadev.png"
              height={44}
              sizes="44px"
              width={44}
            />
          </div>
          <div className="flex flex-col">
            <p>Ray Arayilakath</p>
            <p className="text-neutral-500">{postDateFormatter.format(metadata.pubDate)}</p>
          </div>
        </div>
      </div>
      <hr className="border-neutral-800" />

      <div className="prose prose-neutral flex max-w-full min-w-0 flex-col gap-5 overflow-x-clip leading-6 text-pretty sm:gap-6 [&>*]:min-w-0">
        <BlogFancybox>
          <Post />
        </BlogFancybox>
      </div>

      <hr className="border-neutral-800" />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="font-display text-2xl sm:text-3xl">Subscribe to emails</p>
          <p className="text-base leading-7 text-neutral-300">
            If you liked reading this blog post, consider subscribing to my mailing list. I&apos;ll
            let you know when I publish something new!
          </p>
        </div>
        <SubscribeForm />
      </div>

      <div className="mt-2 mb-16 flex flex-col items-center gap-1 text-center sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-2 sm:gap-y-1">
        <p>© 2026 Rayhan Noufal Arayilakath</p>
        <p aria-hidden="true" className="hidden sm:block">
          |
        </p>
        <div className="flex flex-wrap justify-center gap-x-2 gap-y-1">
          <Link href="/">Home</Link>
          <Link href="https://x.com/rayhanadev">Twitter</Link>
          <Link href="https://github.com/rayhanadev">GitHub</Link>
        </div>
      </div>
    </main>
  );
}
