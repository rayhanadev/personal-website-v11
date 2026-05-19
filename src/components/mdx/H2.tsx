import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

const headingBase =
  "group relative scroll-mt-28 text-balance font-display font-normal tracking-[-0.03em] text-white";

export function H2({ className, ...props }: ComponentPropsWithoutRef<"h2">) {
  return (
    <h2
      className={cn(headingBase, "mt-12 text-2xl leading-none sm:mt-14 sm:text-4xl", className)}
      {...props}
    />
  );
}
