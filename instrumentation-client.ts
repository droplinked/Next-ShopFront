import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const environment =
  process.env.NEXT_PUBLIC_ENV ?? process.env.NODE_ENV ?? 'unknown';
const release = process.env.NEXT_PUBLIC_SENTRY_RELEASE;

if (dsn) {
  Sentry.init({
    dsn,
    environment,
    release,
    tracesSampleRate: 0.1,
    // PII-stripping mirrors droplinked-shopfront/src/instrument.ts conventions:
    // strip query strings + auth headers + cookies before send.
    sendDefaultPii: false,
    beforeSend(event) {
      try {
        if (event.request) {
          if (event.request.url) {
            event.request.url = event.request.url.split('?')[0];
          }
          if (event.request.cookies) {
            event.request.cookies = undefined as any;
          }
          if (event.request.headers) {
            const h = event.request.headers as Record<string, string>;
            delete h.Authorization;
            delete h.authorization;
            delete h.Cookie;
            delete h.cookie;
            delete h['x-auth-token'];
          }
        }
        if (event.user) {
          // Drop direct identifiers; keep only an opaque id if present.
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
