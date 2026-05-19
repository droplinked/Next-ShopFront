import { withSentryConfig } from '@sentry/nextjs';

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
