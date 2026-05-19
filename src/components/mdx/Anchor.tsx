import type { ComponentPropsWithoutRef } from "react";

import Link from "@/components/Link";
import { cn } from "@/lib/utils";

export function Anchor({ children, className, ...props }: ComponentPropsWithoutRef<"a">) {
  const isHeadingAnchor = typeof className === "string" && className.includes("not-prose");

  return (
    <Link
      className={cn(
        isHeadingAnchor
          ? "!no-underline !decoration-transparent text-inherit"
          : "decoration-neutral-600 decoration-[0.08em] underline-offset-4 transition-colors duration-150 ease-out hover:text-white hover:decoration-white",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
