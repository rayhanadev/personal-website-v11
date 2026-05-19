import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type DivProps = ComponentPropsWithoutRef<"div"> & {
  "data-language"?: string;
  "data-remark-code-title"?: boolean | string;
};

export function Div({
  children,
  className,
  "data-language": language,
  "data-remark-code-title": codeTitle,
  ...props
}: DivProps) {
  if (codeTitle === undefined) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mb-[-1.5rem] flex min-h-10 min-w-0 max-w-full items-center justify-between gap-3 rounded-t-md border border-white/10 bg-black px-3 py-2 font-mono text-xs text-neutral-300 [color-scheme:dark] sm:px-4 [&+pre]:mt-0 [&+pre]:rounded-t-none [&+pre]:border-t-0",
        className,
      )}
      data-language={language}
      data-remark-code-title=""
      {...props}
    >
      <span className="min-w-0 truncate">{children}</span>
      {language ? (
        <span className="shrink-0 rounded border border-white/10 px-1.5 py-0.5 text-[11px] text-neutral-500">
          {language}
        </span>
      ) : null}
    </div>
  );
}
