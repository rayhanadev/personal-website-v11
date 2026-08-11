import { createInstrumentation } from "evlog/next/instrumentation";
import { createSentryDrain } from "evlog/sentry";

import { env } from "@/env";

export const { register, onRequestError } = createInstrumentation({
  service: "web",
  captureOutput: true,
  drain: env.NEXT_PUBLIC_SENTRY_DSN
    ? createSentryDrain({ dsn: env.NEXT_PUBLIC_SENTRY_DSN })
    : undefined,
});
