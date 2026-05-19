import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { handle } from "hono/vercel";

import { env } from "@/env";
import { fetchCurrentIPhoneLocation, type LocationUnavailableMetadata } from "@/lib/icloud";

export type { LocationMetadata } from "@/lib/icloud";

const app = new Hono().basePath("/api/location");
app.use("/*", bearerAuth({ token: env.LOCATION_API_TOKEN }));

app.get("/", async (c) => {
  const metadata = await fetchCurrentIPhoneLocation();
  if (!metadata.ok) {
    return c.json(metadata, statusForReason(metadata.reason));
  }

  return c.json(metadata);
});

function statusForReason(reason: LocationUnavailableMetadata["reason"]): 404 | 502 | 503 {
  switch (reason) {
    case "device_not_found":
    case "location_unavailable":
      return 404;
    case "apple_error":
    case "icloud_unauthorized":
    case "invalid_response":
      return 502;
    case "missing_credentials":
    case "invalid_credentials":
    case "two_factor_required":
      return 503;
  }
}

export const GET = handle(app);
