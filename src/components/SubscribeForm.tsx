"use client";

import { useActionState, useId } from "react";

import { subscribe } from "@/actions/subscribe";
import type { SubscribeFormState } from "@/actions/subscribe";
import { cn } from "@/lib/utils";

export default function SubscribeForm() {
  const emailId = useId();
  const statusId = useId();
  const [state, formAction, pending] = useActionState<SubscribeFormState, FormData>(subscribe, {
    success: false,
    message: "",
  });
  const isInvalid = state.message.length > 0 && !state.success;

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <label htmlFor={emailId} className="text-xs text-neutral-400">
        Email Address
      </label>
      <div
        className={cn(
          "flex min-w-0 flex-row transition-opacity duration-150 ease-out",
          pending && "opacity-70",
        )}
      >
        <input
          aria-describedby={state.message ? statusId : undefined}
          aria-invalid={isInvalid}
          autoCapitalize="none"
          autoComplete="email"
          className={cn(
            "min-w-0 flex-1 border border-r-0 border-neutral-500 bg-transparent px-2 py-1 text-sm placeholder-neutral-500 transition-[border-color,color,box-shadow] duration-150 ease-out hover:border-white focus:border-white focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none disabled:cursor-not-allowed",
            isInvalid && "border-red-400 hover:border-red-300 focus:border-red-300",
          )}
          disabled={pending}
          id={emailId}
          inputMode="email"
          name="email"
          placeholder="you@example.com…"
          required
          spellCheck={false}
          type="email"
        />
        <button
          className={cn(
            "shrink-0 cursor-pointer border border-white bg-white px-2 py-1 text-black transition-[background-color,color,transform] duration-150 ease-out will-change-transform",
            "hover:bg-neutral-200 active:scale-[0.97] active:bg-neutral-300",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black",
            "disabled:cursor-wait disabled:border-neutral-500 disabled:bg-black disabled:text-white disabled:active:scale-100",
          )}
          disabled={pending}
          type="submit"
        >
          {pending ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      <p
        aria-live="polite"
        className={cn(
          "min-h-5 text-sm leading-5",
          state.success ? "text-neutral-400" : "text-red-400",
        )}
        id={statusId}
        role="status"
      >
        {state.message}
      </p>
    </form>
  );
}
