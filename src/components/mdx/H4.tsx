import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

const headingBase =
  "group relative scroll-mt-28 text-balance font-display font-normal tracking-[-0.03em] text-white";

export function H4({ className, ...props }: ComponentPropsWithoutRef<"h4">) {
  return (
    <h4
      className={cn(
        headingBase,
        "mt-9 text-xl leading-none before:mr-2 before:text-neutral-600 before:content-['//']",
        className,
      )}
      {...props}
    />
  );
}
