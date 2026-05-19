import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export function HorizontalRule({ className, ...props }: ComponentPropsWithoutRef<"hr">) {
  return (
    <hr
      className={cn(
        "my-8 h-px border-0 bg-linear-to-r from-transparent via-neutral-700 to-transparent",
        className,
      )}
      {...props}
    />
  );
}
