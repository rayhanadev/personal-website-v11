import { zValidator as validator } from "@hono/zod-validator";
import { Result } from "better-result";
import { Hono } from "hono";
import { handle } from "hono/vercel";
import { Resend } from "resend";
import { z } from "zod";

import { env } from "@/env";

const app = new Hono().basePath("/api/subscribe");

const resend = new Resend(env.RESEND_API_KEY);

const SvixMetadata = z.object({
  "svix-id": z.string(),
  "svix-timestamp": z.string(),
  "svix-signature": z.string(),
});

type SvixMetadata = z.infer<typeof SvixMetadata>;

app.post("/webhook", validator("header", SvixMetadata), async (c) => {
  const payload = await c.req.text();
  const headers = c.req.valid("header");

  if (!headers["svix-id"] || !headers["svix-timestamp"] || !headers["svix-signature"]) {
    return c.json({ success: false, message: "Missing webhook signature headers." }, 400);
  }

  const result = await Result.tryPromise(async () =>
    resend.webhooks.verify({
      payload,
      headers: {
        id: headers["svix-id"],
        timestamp: headers["svix-timestamp"],
        signature: headers["svix-signature"],
      },
      webhookSecret: env.RESEND_WEBHOOK_SECRET,
    }),
  );

  if (Result.isError(result)) {
    return c.json({ success: false, message: "Invalid webhook signature." }, 400);
  }

  const event = result.unwrap();

  if (event.type !== "email.clicked") {
    return c.json({ success: true, message: `Event ${event.type} is ignored.` });
  }

  const email = event.data.to[0];

  if (!email) {
    return c.json({ success: false, message: "Missing recipient email for clicked event." }, 400);
  }

  const contacts = await resend.contacts.list({
    audienceId: env.RESEND_SEGMENT_ID,
  });

  if (contacts.error) {
    return c.json({ success: false, message: "Failed to list contacts." }, 500);
  }

  const contact = contacts.data.data.find((c) => c.email === email);

  if (!contact) {
    return c.json(
      { success: false, message: "Failed to find a Resend contact for this email address." },
      500,
    );
  }

  const update = await resend.contacts.update({
    id: contact.id,
    audienceId: env.RESEND_SEGMENT_ID,
    unsubscribed: false,
  });

  if (update.error) {
    return c.json({ success: false, message: "Failed to mark user as subscribed." }, 500);
  }

  return c.json({ success: true, message: `Subscribed ${email} to mailing list.` });
});

export const POST = handle(app);
