import { scrubSentryEvent } from "./scrubSentryEvent";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { init } = await import("@sentry/nextjs");
    init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      sendDefaultPii: false,
      beforeSend: scrubSentryEvent,
      sampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 0.2,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    const { init } = await import("@sentry/nextjs");
    init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      sendDefaultPii: false,
      beforeSend: scrubSentryEvent,
      sampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    });
  }
}
