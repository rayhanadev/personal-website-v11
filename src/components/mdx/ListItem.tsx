import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export function ListItem({ className, ...props }: ComponentPropsWithoutRef<"li">) {
  return <li className={cn("leading-7", className)} {...props} />;
}
