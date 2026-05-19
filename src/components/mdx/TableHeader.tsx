import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export function TableHeader({ className, ...props }: ComponentPropsWithoutRef<"th">) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left font-display text-xs font-normal tracking-[0.16em] text-neutral-300 uppercase",
        className,
      )}
      {...props}
    />
  );
}
