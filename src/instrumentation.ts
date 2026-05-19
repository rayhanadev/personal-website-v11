import * as Sentry from "@sentry/nextjs";
import { registerOTel } from "@vercel/otel";

export async function register() {
  registerOTel({ serviceName: "web" });

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
    const { register } = await import("./lib/evlog");
    register();
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export async function onRequestError(
  error: { digest?: string } & Error,
  request: { path: string; method: string; headers: Record<string, string> },
  context: { routerKind: string; routePath: string; routeType: string; renderSource: string },
) {
  Sentry.captureRequestError(error, request, context);
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { onRequestError } = await import("./lib/evlog");
    onRequestError(error, request, context);
  }
}
