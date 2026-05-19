import { createInstrumentation } from "evlog/next/instrumentation";
import { createSentryDrain } from "evlog/sentry";

import { env } from "@/env";

export const { register, onRequestError } = createInstrumentation({
  service: "web",
  captureOutput: true,
  drain: createSentryDrain({
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
  }),
});
