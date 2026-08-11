import Glider from "@/components/Glider";
import Kaomoji from "@/components/Kaomoji";
import Link from "@/components/Link";
import MillionLogo from "@/components/MillionLogo";
import Socials from "@/components/Socials";
import { fetchLocation } from "@/lib/icloud";

async function fetchHomeData() {
  const location = await fetchLocation().catch(() => null);

  return { location };
}

export const revalidate = 21600;

export default async function Home() {
  const { location } = await fetchHomeData();

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto mt-24 flex w-full max-w-2xl flex-1 flex-col gap-12 px-6 pb-12 focus:outline-none sm:mt-0 sm:px-0 sm:pt-16 sm:pb-16"
    >
      <div className="flex flex-1 flex-col sm:justify-center">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-4xl text-balance">Ray Arayilakath</h1>
            <p>Software Engineer, Applied AI + Infrastructure</p>
            <Socials />
          </div>
          <div className="flex w-full flex-col gap-4">
            <p>
              Hi, I&apos;m Ray (aka <Link href="https://x.com/rayhanadev">@rayhanadev</Link>)!{" "}
              <Kaomoji />
            </p>
            <p className="leading-6.5 text-pretty">
              I run{" "}
              <Link href="https://purduehackers.com" className="group relative whitespace-nowrap">
                Purdue Hackers<span className="tracking-[15.64px]">&nbsp;</span>
                <Glider className="absolute right-0 bottom-[3px] mix-blend-difference group-hover:text-amber-300" />
              </Link>
              , where we’re working hard to make Purdue one of the best places in the world to be a
              young and ambitious builder. We&apos;re backed by Paul Graham, Mitchell Hashimoto, and
              a bunch of cool folks whose work I really admire.
            </p>
            <p className="leading-6.5 text-pretty">
              I also work as a software engineer at{" "}
              <Link href="https://million.dev" className="group relative whitespace-nowrap">
                Million<span className="tracking-[21.14px]">&nbsp;</span>
                <MillionLogo className="absolute right-0 bottom-[3px] mix-blend-difference" />
              </Link>
              , where we&apos;re building open-source developer tools and infrastructure for
              training and evaluating the next generation of coding agents. Before that, I spent
              time at Replit, Deel, Hack Club, and several early-stage startups. I believe in the
              power of free and open-source software to make powerful tools accessible to everyone.
            </p>
            <p className="leading-6.5 text-pretty">
              I like hard problems, new ideas, and talking to cool folks. If you&apos;re working on
              something interesting, feel free to{" "}
              <Link href="mailto:me@rayhanadev.com">shoot me an email</Link> and say hi! :)
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-row items-end justify-end">
        <div className="flex flex-col items-end">
          {location ? <p>Last Seen: {location}</p> : null}
        </div>
      </div>
    </main>
  );
}
