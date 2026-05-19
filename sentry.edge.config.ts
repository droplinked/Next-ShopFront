import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
const environment =
  process.env.NEXT_PUBLIC_ENV ?? process.env.NODE_ENV ?? 'unknown';
const release =
  process.env.SENTRY_RELEASE ?? process.env.NEXT_PUBLIC_SENTRY_RELEASE;

if (dsn) {
  Sentry.init({
    dsn,
    environment,
    release,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    beforeSend(event) {
      try {
        if (event.request?.url) {
          event.request.url = event.request.url.split('?')[0];
        }
        if (event.user) {
          delete (event.user as any).email;
          delete (event.user as any).ip_address;
          delete (event.user as any).username;
        }
      } catch {
        // Never let beforeSend throw.
      }
      return event;
    },
  });
}
