import { withSentryConfig } from '@sentry/nextjs';

// Content-Security-Policy in Report-Only mode. Mirrors the directives
// shipped on the other three droplinked frontends so violation reports
// are comparable. NOT enforcing yet — emits violations to the
// configured report-uri so we can audit before flipping to enforce.
// Operator: replace the placeholder report-uri with the project's real
// Sentry Security endpoint.
const cspReportOnly = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.droplinked.com https://*.googletagmanager.com https://www.google-analytics.com",
    "connect-src 'self' https://apiv3.droplinked.com https://apiv3dev.droplinked.com https://*.algolia.net https://*.algolianet.com https://*.sentry.io wss://* https://*.googleapis.com",
    "img-src 'self' data: blob: https:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "frame-src 'self' https://*.stripe.com",
    "report-uri https://sentry.io/api/<project>/security/?sentry_key=<key>",
].join('; ');

/** @type {import('next').NextConfig} */

// CSP Report-Only — week 1 of rollout. See droplink-packages docs PR #36
// (`docs/csp-audit-2026-05-19.md`). Report-Only collects violations
// without blocking. Promote to enforcing `Content-Security-Policy` only
// after 7-day Sentry observation window per the rollout plan.
//
// `'unsafe-eval'` is required by ethers@5 BigNumber internals + some
// Solana RPC adapters. Tracked for removal via ethers@6 / viem upgrade.
// `'unsafe-inline'` is required for GTM bootstrap + Next.js style-jsx.
const cspReportOnly = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.cdnfonts.com",
    "font-src 'self' https://fonts.gstatic.com https://fonts.cdnfonts.com data:",
    "img-src 'self' data: blob: https://upload-file-droplinked.s3.amazonaws.com https://upload-file-flatlay.s3.us-west-2.amazonaws.com https://files.cdn.printful.com https://*.cloudfront.net https://www.google-analytics.com",
    "connect-src 'self' https://apiv3.droplinked.com https://apiv3dev.droplinked.com https://tools.droplinked.com https://ipapi.co https://accept.paymob.com https://*.ingest.sentry.io https://www.google-analytics.com",
    "frame-src 'self' https://accept.paymob.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self' https://accept.paymob.com",
    "object-src 'none'",
    "upgrade-insecure-requests",
    // TODO(security): wire report-uri to project Sentry CSP endpoint once
    // operator confirms project DSN. Pattern:
    //   https://oXXXX.ingest.sentry.io/api/<project_id>/security/?sentry_key=<key>
    // "report-uri https://<sentry-ingest-host>/api/<project_id>/security/?sentry_key=<key>",
].join('; ')

const nextConfig = {
    // Dockerfile (runner stage) copies /app/.next/standalone — require Next.js
    // to emit that directory at build time. Without this, every LIVE deploy
    // fails at `COPY --from=builder /app/.next/standalone ./` (issue #38).
    output: 'standalone',
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'upload-file-flatlay.s3.us-west-2.amazonaws.com',
            },
            {
                protocol: 'https',
                hostname: 'upload-file-droplinked.s3.amazonaws.com',
            },
        ],
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Content-Security-Policy-Report-Only',
                        value: cspReportOnly,
                    },
                ],
            },
        ];
    },
    webpack(config, options) {
        config.module.rules.push({
            test: /\.svg$/,
            use: ["@svgr/webpack"],
        });

        return config;
    },
};

export default withSentryConfig(nextConfig, {
    // Suppress all Sentry CLI logs during build unless the auth token
    // is wired (then we want CI to surface upload failures).
    silent: !process.env.SENTRY_AUTH_TOKEN,
    // Org / project / authToken are optional at build time when no auth
    // token is set; the SDK still functions at runtime via the DSN.
    // When all three are present (CI), `withSentryConfig` automatically
    // uploads source maps so production stack traces de-minify.
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    // Tag uploaded source maps with the same release identifier used by
    // the SDK at runtime — without this, uploaded maps don't match the
    // events Sentry receives.
    release: {
        name: process.env.SENTRY_RELEASE || process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    },
    // Don't upload source maps unless an auth token is explicitly provided.
    disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
    disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
    // Tunnel through a Next.js route to bypass ad-blockers (optional, default off).
    // tunnelRoute: '/monitoring',
    hideSourceMaps: true,
    widenClientFileUpload: true,
});
