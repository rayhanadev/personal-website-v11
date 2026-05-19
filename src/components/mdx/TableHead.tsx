import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export function TableHead({ className, ...props }: ComponentPropsWithoutRef<"thead">) {
  return (
    <thead className={cn("border-b border-neutral-800 bg-white/[0.04]", className)} {...props} />
  );
}
