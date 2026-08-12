import type { ReactNode } from "react";

import Link from "@/components/Link";

// Advance of a space in General Sans at 16px. The gap between the text and the mark
// is made of letter-spacing on a real space so the link's own underline runs beneath
// it — Chrome does not paint text-decoration across atomic inlines or padding, so an
// inline <svg> or padding would break the line instead of extending it.
const SPACE_ADVANCE = 3.36;
const GAP = 6;

export default function LogoLink({
  href,
  width,
  mark,
  children,
}: {
  href: string;
  /** Rendered width of the mark in px, used to reserve underlined space for it. */
  width: number;
  mark: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="group relative whitespace-nowrap">
      {children}
      <span style={{ letterSpacing: `${GAP + width - SPACE_ADVANCE}px` }}>&nbsp;</span>
      {/* The mark is out of flow, so ::selection cannot restyle it — difference blending
          is what makes it invert against the highlight. On hover the mark carries a brand
          colour, which blending would distort, so the blend is dropped for that state. */}
      <span className="absolute right-0 bottom-[3px] flex mix-blend-difference group-hover:mix-blend-normal">
        {mark}
      </span>
    </Link>
  );
}
