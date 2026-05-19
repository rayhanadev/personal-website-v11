import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export function Strong({ className, ...props }: ComponentPropsWithoutRef<"strong">) {
  return <strong className={cn("font-semibold text-white", className)} {...props} />;
}
