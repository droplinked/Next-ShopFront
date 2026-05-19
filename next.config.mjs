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
const nextConfig = {
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
