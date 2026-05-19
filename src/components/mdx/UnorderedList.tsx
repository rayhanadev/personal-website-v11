import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export function UnorderedList({ className, ...props }: ComponentPropsWithoutRef<"ul">) {
  return (
    <ul
      className={cn(
        "my-0 grid gap-3 pl-0 text-neutral-300 [&>li]:relative [&>li]:pl-7 [&>li]:marker:content-none [&>li]:before:absolute [&>li]:before:top-[0.72em] [&>li]:before:left-0 [&>li]:before:h-1.5 [&>li]:before:w-1.5 [&>li]:before:bg-white",
        className,
      )}
      {...props}
    />
  );
}
