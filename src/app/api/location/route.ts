import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { handle } from "hono/vercel";
import { cacheLife } from "next/cache";

import { env } from "@/env";
import { type LocationMetadata, fetchCurrentIPhoneLocation } from "@/lib/icloud";

/**
 * Short enough to stay useful, long enough that a caller polling this can't
 * hammer Apple on our behalf. Every caller sees the same phone, so one shared
 * entry is correct.
 */
const LOCATION_TTL_SECONDS = 60;

const app = new Hono().basePath("/api/location");

app.use("/*", async (c, next) => {
  const token = env.LOCATION_API_TOKEN;

  if (!token) {
    return c.json({ success: false, message: "Location API isn't configured." }, 503);
  }

  return bearerAuth({ token })(c, next);
});

app.get("/", async (c) => {
  const metadata = await cachedLocation();

  if (!metadata.success) {
    return c.json(metadata, 500);
  }

  return c.json(metadata);
});

async function cachedLocation(): Promise<LocationMetadata> {
  "use cache";
  cacheLife({ revalidate: LOCATION_TTL_SECONDS });

  return fetchCurrentIPhoneLocation();
}

export const GET = handle(app);
