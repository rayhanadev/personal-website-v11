"use client";

import { Fancybox } from "@fancyapps/ui/dist/fancybox/";
import type { FancyboxOptions } from "@fancyapps/ui/dist/fancybox/";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

const fancyboxOptions: Partial<FancyboxOptions> = {
  groupAll: true,
  placeFocusBack: true,
  theme: "dark",
  wheel: "slide",
};

export default function BlogFancybox({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    Fancybox.bind(root, "[data-fancybox]", fancyboxOptions);

    return () => {
      Fancybox.unbind(root, "[data-fancybox]");
    };
  }, []);

  return (
    <div ref={rootRef} className="contents">
      {children}
    </div>
  );
}
