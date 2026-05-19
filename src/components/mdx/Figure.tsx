import type { ImageProps } from "next/image";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

import { MdxImage } from "./MdxImage";
import type { MdxImageProps } from "./MdxImage";

type FigureProps = ComponentPropsWithoutRef<"figure"> & {
  alt?: string;
  caption?: ReactNode;
  imageClassName?: string;
  imageProps?: Omit<MdxImageProps, "alt" | "className" | "src">;
  src?: ImageProps["src"];
};

export function Figure({
  alt = "",
  caption,
  className,
  children,
  imageClassName,
  imageProps,
  src,
  ...props
}: FigureProps) {
  return (
    <figure className={cn("my-4 grid min-w-0 max-w-full gap-3", className)} {...props}>
      <div className="max-w-full min-w-0 overflow-hidden border border-neutral-800 bg-neutral-950/60 p-1 shadow-[0_24px_80px_rgb(0_0_0/0.45)] [&_img]:border-0 [&_img]:shadow-none">
        {src ? (
          <MdxImage
            alt={alt}
            className={imageClassName}
            fancyboxCaption={typeof caption === "string" ? caption : alt}
            src={src}
            {...imageProps}
          />
        ) : (
          children
        )}
      </div>
      {caption ? (
        <figcaption className="text-center text-sm leading-6 text-balance text-neutral-500">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
