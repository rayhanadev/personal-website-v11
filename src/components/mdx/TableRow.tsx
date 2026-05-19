import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export function TableRow({ className, ...props }: ComponentPropsWithoutRef<"tr">) {
  return (
    <tr
      className={cn(
        "border-b border-neutral-900 last:border-b-0 hover:bg-white/[0.025]",
        className,
      )}
      {...props}
    />
  );
}
