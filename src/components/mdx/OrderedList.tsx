import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export function OrderedList({ className, ...props }: ComponentPropsWithoutRef<"ol">) {
  return (
    <ol
      className={cn(
        "my-0 grid list-none gap-3 pl-0 text-neutral-300 [counter-reset:step] [&>li]:relative [&>li]:pl-9 [&>li]:[counter-increment:step] [&>li]:before:absolute [&>li]:before:top-0 [&>li]:before:left-0 [&>li]:before:font-display [&>li]:before:text-sm [&>li]:before:leading-7 [&>li]:before:text-neutral-500 [&>li]:before:content-[counter(step,decimal-leading-zero)]",
        className,
      )}
      {...props}
    />
  );
}
