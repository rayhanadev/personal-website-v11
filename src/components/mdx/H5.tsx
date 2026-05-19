import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

const headingBase =
  "group relative scroll-mt-28 text-balance font-display font-normal tracking-[-0.03em] text-white";

export function H5({ className, ...props }: ComponentPropsWithoutRef<"h5">) {
  return (
    <h5
      className={cn(
        headingBase,
        "mt-8 text-base leading-none text-neutral-200 uppercase tracking-[0.16em]",
        className,
      )}
      {...props}
    />
  );
}
