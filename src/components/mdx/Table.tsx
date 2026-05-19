import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export function Table({ className, ...props }: ComponentPropsWithoutRef<"table">) {
  return (
    <div className="my-2 max-w-full min-w-0 overflow-x-auto border border-neutral-800 bg-neutral-950/40">
      <table className={cn("w-full min-w-max border-collapse text-sm", className)} {...props} />
    </div>
  );
}
