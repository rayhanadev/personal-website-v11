import NextLink from "next/link";
import type { AnchorHTMLAttributes, DetailedHTMLProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

const HOST_WHITELIST = ["ring.purduehackers.com"];

export default function Link({
  href,
  children,
  className,
  rel,
  target,
  ...props
}: {
  children: ReactNode;
} & DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>) {
  const isInternalLink = href && (href.startsWith("/") || href.startsWith("#"));
  const isExternalWebLink =
    !isInternalLink && !HOST_WHITELIST.includes(new URL(href ?? "").hostname);

  const linkClassName = cn(
    "cursor-pointer underline decoration-neutral-500 decoration-1 underline-offset-2 transition-[color,text-decoration-color] duration-150 ease-out hover:decoration-inherit focus-visible:ring-1 focus-visible:ring-white/40 focus-visible:outline-none",
    className,
  );

  if (isInternalLink) {
    return (
      <NextLink
        href={href}
        className={linkClassName}
        rel={rel}
        target={target}
        scroll={false}
        {...props}
      >
        {children}
      </NextLink>
    );
  }

  return (
    <a
      target={target ?? (isExternalWebLink ? "_blank" : undefined)}
      rel={rel ?? (isExternalWebLink ? "noopener noreferrer" : undefined)}
      className={linkClassName}
      href={href}
      {...props}
    >
      {children}
    </a>
  );
}
