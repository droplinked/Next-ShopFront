import { withSentryConfig } from '@sentry/nextjs';

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
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.cdnfonts.com",
    "font-src 'self' https://fonts.gstatic.com https://fonts.cdnfonts.com data:",
    // Aggregate storefront: product images come from ARBITRARY merchant CDNs
    // (Shopify custom domains, retailer CDNs, etc.), so `img-src` must allow any
    // https image host or imported products render as broken placeholders. Kept
    // scheme-restricted to https (+ data:/blob: for inline). Non-image directives
    // stay tight.
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://apiv3.droplinked.com https://apiv3dev.droplinked.com https://tools.droplinked.com https://ipapi.co https://accept.paymob.com https://*.ingest.sentry.io https://www.google-analytics.com https://api.stripe.com",
    "frame-src 'self' https://accept.paymob.com https://js.stripe.com https://hooks.stripe.com",
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
        // Aggregate storefront serves product images from ARBITRARY merchant
        // CDNs (Shopify custom domains like theshoecircle.com, cdn.shopify.com,
        // retailer CDNs). next/image REJECTS any host not listed here, which
        // rendered every imported product image as a broken placeholder. Allow
        // any https host so merchant images resolve; the droplinked S3 hosts are
        // implicitly covered but kept explicit for intent.
        remotePatterns: [
            { protocol: 'https', hostname: '**' },
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
