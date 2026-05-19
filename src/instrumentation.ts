import { registerOTel } from "@vercel/otel";

export async function register() {
  registerOTel({ serviceName: "web" });

  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "production") {
    const { register } = await import("./lib/evlog");
    register();
  }
}

export async function onRequestError(
  error: { digest?: string } & Error,
  request: { path: string; method: string; headers: Record<string, string> },
  context: { routerKind: string; routePath: string; routeType: string; renderSource: string },
) {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "production") {
    const { onRequestError } = await import("./lib/evlog");
    onRequestError(error, request, context);
  }
}
