import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: "https://0580668a5697698bd3dbf2ae0e68fb01@o4506435279126528.ingest.us.sentry.io/4511349665234944",
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.01,
  integrations: [
    Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
  ],
})
