import Link from "@/components/Link";

export default function MailingConfirmPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-24 focus:outline-none"
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-5xl">You&apos;re subscribed!</h1>
          <p className="max-w-lg leading-6 text-pretty text-neutral-300">
            Thanks for confirming your email! I&apos;ll make sure to send you new posts when
            they&apos;re ready! (っ&apos;-&apos;)╮=͟͟͞͞💌
          </p>
        </div>
        <p>
          <Link href="/">Back home</Link>
        </p>
      </div>
    </main>
  );
}
