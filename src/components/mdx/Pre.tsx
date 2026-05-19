import type { ComponentPropsWithoutRef } from "react";

import CodeBlock from "./CodeBlock";

export function Pre({ className, ...props }: ComponentPropsWithoutRef<"pre">) {
  return <CodeBlock className={className} {...props} />;
}
