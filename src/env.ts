import { createEnv } from "@t3-oss/env-nextjs";
import * as z from "zod";

export const env = createEnv({
  server: {
    BETTER_AUTH_SECRET: z.string(),
    RESEND_API_KEY: z.string(),
    RESEND_SEGMENT_ID: z.string(),
    RESEND_WEBHOOK_SECRET: z.string(),
    TURSO_AUTH_TOKEN: z.string(),
    TURSO_DATABASE_URL: z.url(),
    NODE_ENV: z.enum(["development", "production"]).default("development"),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.url(),
  },
  runtimeEnv: {
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_SEGMENT_ID: process.env.RESEND_SEGMENT_ID,
    RESEND_WEBHOOK_SECRET: process.env.RESEND_WEBHOOK_SECRET,
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV,
  },
});
