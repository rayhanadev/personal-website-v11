import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export function TableCell({ className, ...props }: ComponentPropsWithoutRef<"td">) {
  return <td className={cn("px-4 py-3 align-top text-neutral-300", className)} {...props} />;
}
