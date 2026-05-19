"use client";

import { Copy01Icon, CopyCheckIcon } from "@hugeicons/core-free-icons";
import { createElement, type ComponentPropsWithoutRef, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type HugeIconNode = readonly (readonly [string, Readonly<Record<string, string | number>>])[];

function HugeIcon({ icon, ...props }: ComponentPropsWithoutRef<"svg"> & { icon: HugeIconNode }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="16"
      viewBox="0 0 24 24"
      width="16"
      {...props}
    >
      {icon.map(([tag, attributes], index) => {
        const { key, ...iconProps } = attributes;

        return createElement(tag, {
          ...iconProps,
          key: key ?? index,
        });
      })}
    </svg>
  );
}

export default function CodeBlock({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"pre">) {
  const preRef = useRef<HTMLPreElement>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  async function copyCode() {
    const code = preRef.current?.querySelector("code")?.textContent ?? "";

    if (!code) {
      return;
    }

    await navigator.clipboard.writeText(code);
    setCopied(true);

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = setTimeout(() => {
      setCopied(false);
    }, 1600);
  }

  return (
    <pre
      ref={preRef}
      className={cn(
        "group/code relative my-2 min-w-0 max-w-full overflow-x-auto rounded-md border border-white/10 !bg-black p-3 font-mono text-xs leading-5 text-neutral-100 shadow-none [color-scheme:dark] sm:p-4 sm:text-[13px] sm:leading-6 [&_code]:rounded-none [&_code]:border-0 [&_code]:!bg-transparent [&_code]:p-0 [&_code]:text-xs [&_code]:leading-5 [&_span.line]:min-h-5 sm:[&_code]:text-[13px] sm:[&_code]:leading-6 sm:[&_span.line]:min-h-6",
        className,
      )}
      {...props}
    >
      <button
        aria-label={copied ? "Copied code" : "Copy code"}
        className="absolute top-2 right-2 z-10 inline-flex size-8 items-center justify-center rounded-md border border-white/10 bg-black/80 text-neutral-400 opacity-100 backdrop-blur transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out hover:border-white/20 hover:bg-neutral-950 hover:text-white focus-visible:ring-1 focus-visible:ring-white/30 focus-visible:outline-none active:scale-95 md:opacity-0 md:group-hover/code:opacity-100 md:focus-visible:opacity-100"
        onClick={copyCode}
        title={copied ? "Copied" : "Copy"}
        type="button"
      >
        <HugeIcon icon={copied ? CopyCheckIcon : Copy01Icon} />
      </button>
      {children}
    </pre>
  );
}
