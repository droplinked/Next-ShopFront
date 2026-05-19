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
    // Suppress all Sentry CLI logs during build; we are not uploading
    // source maps in CI yet (no SENTRY_AUTH_TOKEN wired).
    silent: true,
    // Org / project are optional at build time when no auth token is set;
    // the SDK still functions at runtime via the DSN.
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    // Don't upload source maps unless an auth token is explicitly provided.
    disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
    disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
    // Tunnel through a Next.js route to bypass ad-blockers (optional, default off).
    // tunnelRoute: '/monitoring',
    hideSourceMaps: true,
    widenClientFileUpload: true,
});
