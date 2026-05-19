import Image from "next/image";
import type { ImageProps } from "next/image";

import { cn } from "@/lib/utils";

export type MdxImageProps = Omit<ImageProps, "alt"> & {
  alt?: string;
  fancybox?: string | false;
  fancyboxCaption?: string;
};

function getImageHref(src: ImageProps["src"]) {
  if (typeof src === "string") {
    return src;
  }

  if ("src" in src) {
    return src.src;
  }

  return src.default.src;
}

export function MdxImage({
  className,
  alt = "",
  fancybox = "blog-gallery",
  fancyboxCaption,
  sizes = "(max-width: 768px) 100vw, 672px",
  src,
  style,
  ...props
}: MdxImageProps) {
  const caption = fancyboxCaption ?? alt;
  const image = (
    <Image
      alt={alt}
      className={cn(
        "h-auto w-full max-w-full border border-neutral-800 bg-neutral-950 object-cover shadow-[0_0_0_1px_rgb(255_255_255/0.03),0_24px_80px_rgb(0_0_0/0.5)]",
        className,
      )}
      decoding="async"
      sizes={sizes}
      src={src}
      style={{ width: "100%", height: "auto", ...style }}
      {...props}
    />
  );

  if (!fancybox) {
    return image;
  }

  return (
    <a
      className="group block max-w-full cursor-zoom-in overflow-hidden focus-visible:ring-1 focus-visible:ring-white/40 focus-visible:outline-none"
      data-caption={caption || undefined}
      data-fancybox={fancybox}
      href={getImageHref(src)}
    >
      {image}
    </a>
  );
}
