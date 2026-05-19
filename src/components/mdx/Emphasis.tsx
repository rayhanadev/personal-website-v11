import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export function Emphasis({ className, ...props }: ComponentPropsWithoutRef<"em">) {
  return <em className={cn("text-neutral-100 italic", className)} {...props} />;
}
