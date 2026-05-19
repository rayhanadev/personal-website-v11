import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export function TableBody({ className, ...props }: ComponentPropsWithoutRef<"tbody">) {
  return <tbody className={cn("divide-y divide-neutral-900", className)} {...props} />;
}
