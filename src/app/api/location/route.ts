import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { handle } from "hono/vercel";

import { env } from "@/env";
import { fetchCurrentIPhoneLocation } from "@/lib/icloud";

const app = new Hono().basePath("/api/location");
app.use("/*", bearerAuth({ token: env.LOCATION_API_TOKEN }));

app.get("/", async (c) => {
  const metadata = await fetchCurrentIPhoneLocation();
  if (!metadata.success) {
    return c.json(metadata, 500);
  }

  return c.json(metadata);
});

export const GET = handle(app);
