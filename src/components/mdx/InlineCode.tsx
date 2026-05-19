import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export function InlineCode({ className, ...props }: ComponentPropsWithoutRef<"code">) {
  const isBlockCode = typeof className === "string" && className.includes("language-");

  return (
    <code
      className={cn(
        isBlockCode
          ? "font-mono text-[13px]"
          : "rounded-md border border-white/10 bg-black px-1.5 py-0.5 font-mono text-[0.88em] text-neutral-100",
        className,
      )}
      {...props}
    />
  );
}
