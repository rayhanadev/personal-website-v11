import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export function Blockquote({ className, ...props }: ComponentPropsWithoutRef<"blockquote">) {
  return (
    <blockquote
      className={cn(
        "my-2 border-l border-white bg-white/[0.035] px-5 py-4 text-neutral-200 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] [&_p]:text-neutral-200",
        className,
      )}
      {...props}
    />
  );
}
