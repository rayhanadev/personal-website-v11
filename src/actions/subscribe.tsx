"use server";

import { Resend } from "resend";
import { z } from "zod";

import ConfirmationEmail from "@/emails/confirmation";
import { env } from "@/env";

export type SubscribeFormState = {
  success: boolean;
  message: string;
};

const SubscribeFormSchema = z.object({
  email: z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
    z.email(),
  ),
});

const resend = new Resend(env.RESEND_API_KEY);

export async function subscribe(_state: SubscribeFormState, payload: FormData) {
  const form = SubscribeFormSchema.safeParse({
    email: payload.get("email"),
  });

  if (!form.success) {
    return { success: false, message: "Enter a valid email address." };
  }

  const subscribe = await resend.contacts.create({
    audienceId: env.RESEND_SEGMENT_ID,
    email: form.data.email,
    unsubscribed: true,
  });

  if (subscribe.error) {
    return { success: false, message: "Couldn’t add that email. Try again in a minute." };
  }

  const confirmation = await resend.emails.send({
    from: "Ray's Updates <hi@mail.rayhanadev.com>",
    to: [form.data.email],
    subject: "Confirm your subscription",
    react: <ConfirmationEmail />,
  });

  if (confirmation.error) {
    return {
      success: false,
      message: "Couldn’t send the confirmation email. Try again in a minute.",
    };
  }

  return {
    success: true,
    message: "Thanks for subscribing. Check your email for a confirmation message.",
  };
}
