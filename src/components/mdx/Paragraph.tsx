import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export function Paragraph({ className, ...props }: ComponentPropsWithoutRef<"p">) {
  return (
    <p
      className={cn(
        "my-0 max-w-none break-words text-base leading-7 text-neutral-300 sm:text-[1.02rem]",
        className,
      )}
      {...props}
    />
  );
}
