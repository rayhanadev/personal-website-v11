import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

const headingBase =
  "group relative scroll-mt-28 text-balance font-display font-normal tracking-[-0.03em] text-white";

export function H6({ className, ...props }: ComponentPropsWithoutRef<"h6">) {
  return (
    <h6
      className={cn(
        headingBase,
        "mt-8 text-sm leading-none text-neutral-400 uppercase tracking-[0.22em]",
        className,
      )}
      {...props}
    />
  );
}
