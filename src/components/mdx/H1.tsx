import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

const headingBase =
  "group relative scroll-mt-28 text-balance font-display font-normal tracking-[-0.03em] text-white";

export function H1({ className, ...props }: ComponentPropsWithoutRef<"h1">) {
  return (
    <h1
      className={cn(headingBase, "mt-14 text-4xl leading-none first:mt-0 sm:text-6xl", className)}
      {...props}
    />
  );
}
