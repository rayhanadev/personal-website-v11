import { env } from "@/env";
import { createInstrumentation } from "evlog/next/instrumentation";
import { createSentryDrain } from "evlog/sentry";

export const { register, onRequestError } = createInstrumentation({
  service: "web",
  captureOutput: true,
  drain: createSentryDrain({
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
  }),
});
