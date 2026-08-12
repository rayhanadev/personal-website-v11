import DeelLogo from "@/components/DeelLogo";
import Glider from "@/components/Glider";
import HackClubLogo from "@/components/HackClubLogo";
import Kaomoji from "@/components/Kaomoji";
import Link from "@/components/Link";
import LogoLink from "@/components/LogoLink";
import MillionLogo from "@/components/MillionLogo";
import ReplitLogo from "@/components/ReplitLogo";
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
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-4xl text-balance">Ray Arayilakath</h1>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <p>Software Engineer, Applied AI + Infrastructure</p>
              <Socials />
            </div>
          </div>
          <div className="flex w-full flex-col gap-3">
            <p>
              Hi, I&apos;m Ray (aka <Link href="https://x.com/rayhanadev">@rayhanadev</Link>)!{" "}
              <Kaomoji />
            </p>
            <p className="leading-6.5 text-pretty">
              I run{" "}
              <LogoLink
                href="https://purduehackers.com"
                width={13}
                mark={<Glider className="group-hover:text-amber-300" />}
              >
                Purdue Hackers
              </LogoLink>
              , where we’re working hard to make Purdue one of the best places in the world to be a
              young and ambitious builder. We&apos;re backed by Paul Graham, Mitchell Hashimoto, and
              a bunch of cool folks whose work I really admire.
            </p>
            <p className="leading-6.5 text-pretty">
              I also work at{" "}
              <LogoLink
                href="https://million.dev"
                width={18.5}
                mark={<MillionLogo className="group-hover:text-[oklch(58%_0.185_292.4)]" />}
              >
                Million
              </LogoLink>
              , where we&apos;re on a mission to make the web faster by building developer tools
              like <Link href="https://github.com/millionco/react-doctor">React Doctor</Link>,
              benchmarks like <Link href="https://react-bench.com">React Bench</Link>, and RL
              environments for training and evaluating frontier coding agents. Before that, I spent
              time at{" "}
              <LogoLink
                href="https://replit.com"
                width={10.8}
                mark={<ReplitLogo className="group-hover:text-[oklch(68%_0.169_43.6)]" />}
              >
                Replit
              </LogoLink>
              ,{" "}
              <LogoLink
                href="https://deel.com"
                width={13}
                mark={<DeelLogo className="group-hover:text-[oklch(68%_0.169_285.7)]" />}
              >
                Deel
              </LogoLink>
              ,{" "}
              <LogoLink
                href="https://hackclub.com"
                width={13}
                mark={<HackClubLogo className="group-hover:text-[oklch(68%_0.169_19.1)]" />}
              >
                Hack Club
              </LogoLink>
              , and several early-stage startups.
            </p>
            <p className="leading-6.5 text-pretty">
              I like hard problems, new ideas, and talking to cool folks. If you&apos;re working on
              something interesting, feel free to{" "}
              <Link href="mailto:me@rayhanadev.com">shoot me an email</Link>
              {location ? (
                <> or if you&apos;re near {location} let&apos;s grab coffee or boba!</>
              ) : (
                <> and say hi! :)</>
              )}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
