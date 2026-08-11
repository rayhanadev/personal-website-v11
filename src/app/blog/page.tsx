import Link from "@/components/Link";
import { getPosts } from "@/lib/blog";

const postDateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

export default function BlogIndex() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto mt-24 flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 pb-12 focus:outline-none sm:mt-39 sm:px-0 sm:pb-16"
    >
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-4xl text-balance">Blog</h1>
        <Link href="/">&lt; Back</Link>
      </div>
      <table className="w-full border-separate border-spacing-x-0 border-spacing-y-1">
        <tbody>
          {getPosts()
            .sort(
              ({ metadata: { pubDate: a } }, { metadata: { pubDate: b } }) =>
                b.valueOf() - a.valueOf(),
            )
            .map(({ slug, metadata }) => (
              <tr key={slug}>
                <td className="pr-4 align-baseline whitespace-nowrap tabular-nums">
                  <time className="text-neutral-700" dateTime={metadata.pubDate.toISOString()}>
                    {postDateFormatter.format(metadata.pubDate)}
                  </time>
                </td>
                <td className="min-w-0 align-baseline">
                  <p className="break-words">
                    <Link
                      href={`/blog/${slug}`}
                      className={slug.startsWith("_") ? "text-neutral-500" : "text-inherit"}
                    >
                      {slug.startsWith("_") && "[Draft] "}
                      {metadata.title}
                    </Link>
                  </p>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </main>
  );
}
