import NextLink from "next/link";
import type { AnchorHTMLAttributes, DetailedHTMLProps, ReactNode } from "react";

import { env } from "@/env";
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
  const url = new URL(
    href && href.startsWith("/") ? `${env.NEXT_PUBLIC_APP_URL}/${href}` : (href ?? ""),
  );

  const isInternalLink = url.pathname.startsWith("/") || url.pathname.startsWith("#");
  const isExternalWebLink = !HOST_WHITELIST.includes(url.hostname);

  const linkClassName = cn(
    "cursor-pointer underline decoration-neutral-500 decoration-1 underline-offset-2 transition-[color,text-decoration-color] duration-150 ease-out hover:decoration-inherit focus-visible:ring-1 focus-visible:ring-white/40 focus-visible:outline-none",
    className,
  );

  if (isInternalLink) {
    return (
      <NextLink href={url} className={linkClassName} rel={rel} target={target} {...props}>
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
