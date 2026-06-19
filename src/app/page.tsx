import Kaomoji from "@/components/Kaomoji";
import Link from "@/components/Link";
import { getPosts } from "@/lib/blog";
import { fetchClaudeTokensThisMonth } from "@/lib/claude";
import { fetchCursorTokensThisMonth } from "@/lib/cursor";
import { fetchLocation } from "@/lib/icloud";
import { env } from "@/env";

function formatCompactTokens(n: number): string {
  if (n >= 1_000_000_000) return `${+(n / 1_000_000_000).toPrecision(2)}B`;
  if (n >= 1_000_000) return `${+(n / 1_000_000).toPrecision(2)}M`;
  if (n >= 1_000) return `${+(n / 1_000).toPrecision(2)}K`;
  return String(n);
}

const postDateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

function getCursorTokens(): Promise<number | null> {
  return env.CURSOR_API_KEY
    ? fetchCursorTokensThisMonth(env.CURSOR_API_KEY, "ray@million.dev").catch(() => null)
    : Promise.resolve(null);
}

function getClaudeTokens(): Promise<number | null> {
  return fetchClaudeTokensThisMonth().catch(() => null);
}

async function fetchHomeData() {
  // location, cursor tokens, and claude tokens are all fetched concurrently.
  const [location, cursorTokens, claudeTokens] = await Promise.all([
    fetchLocation().catch(() => null),
    getCursorTokens(),
    getClaudeTokens(),
  ]);

  const tokensBurned =
    cursorTokens === null && claudeTokens === null
      ? null
      : (cursorTokens ?? 0) + (claudeTokens ?? 0);

  return { location, tokensBurned };
}

export const revalidate = 21600;

export default async function Home() {
  const { location, tokensBurned } = await fetchHomeData();

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto mt-24 flex w-full max-w-2xl flex-1 flex-col gap-12 px-6 pb-12 focus:outline-none sm:mt-39 sm:px-0 sm:pb-16"
    >
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-5xl text-balance">Ray Arayilakath</h1>
          <p>
            <Link href="https://x.com/rayhanadev">@rayhanadev</Link> • Software Engineer, Applied AI
            + Infrastructure
          </p>
        </div>
        <div className="flex w-full flex-col gap-4">
          <p>
            Hi, I&apos;m Ray! <Kaomoji />
          </p>
          <p className="leading-6 text-pretty">
            I run{" "}
            <Link href="https://purduehackers.com" className="group">
              Purdue Hackers <span className="group-hover:text-amber-300">.߆</span>
            </Link>
            , where we’re working hard to make Purdue one of the best places in the world to be a
            young and ambitious builder. We&apos;re backed by Paul Graham, Mitchell Hashimoto, and a
            bunch of cool folks whose work I really admire.
          </p>
          <p className="leading-6 text-pretty">
            I also work as a software engineer at <Link href="https://million.dev">Million</Link>,
            where we&apos;re building the next generation of AI-native developer tools. Before that,
            I interned at Replit, Deel, and several early-stage startups. I also publish open-source
            platform and infrastructure tooling on{" "}
            <Link href="https://github.com/rayhanadev">my GitHub</Link>.
          </p>
          <p className="leading-6 text-pretty">
            I like hard problems, wacky ideas, and meeting cool people. If you&apos;re building
            something interesting, feel free to{" "}
            <Link href="mailto:me@rayhanadev.com">shoot me an email</Link> and say hi! :)
          </p>
        </div>
      </div>
      <div className="flex flex-col">
        <h2 className="mb-1">Posts:</h2>
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
      </div>
      <div className="mt-auto flex flex-row items-end justify-between">
        <div className="flex flex-row gap-1">
          <Link href="https://ring.purduehackers.com/prev">&lt;</Link>{" "}
          <Link href="https://ring.purduehackers.com/">Purdue Hackers</Link>{" "}
          <Link href="https://ring.purduehackers.com/next">&gt;</Link>
        </div>
        <div className="flex flex-col items-end">
          {tokensBurned !== null ? (
            <p>Tokens Burned (30d): {formatCompactTokens(tokensBurned)}</p>
          ) : null}
          {location ? <p>Last Seen: {location}</p> : null}
        </div>
      </div>
    </main>
  );
}
