# Simplified Dockerfile for Next.js Production Deployment (Standalone Output)

# ---- Base Stage ----
# Use a specific Node.js version on Alpine Linux for a small base image.
# Node 22 required by @droplinked_inc/web3@1.0.0 (engines.node >=22.0.0).
FROM node:22-alpine AS base

# ---- Dependencies Stage ----
# Install dependencies first to leverage Docker cache.
FROM base AS deps
WORKDIR /app

# Copy package.json and lock file
# If using npm, copy package.json and package-lock.json
COPY package.json yarn.lock* ./

# Copy scripts/ BEFORE install so the npm `preinstall` supply-chain
# guard script is present at install time. Without this, install fails
# with ENOENT on scripts/preinstall-supply-chain-guard.js because the
# rest of the source tree is not COPYed until the builder stage.
# Cousin of droplinked-backend#1300.
COPY scripts ./scripts

# Install dependencies using yarn
# Use --frozen-lockfile to ensure reproducible installs based on the lock file.
RUN yarn install --frozen-lockfile

# ---- Builder Stage ----
# Build the Next.js application.
FROM base AS builder
WORKDIR /app

# Copy dependencies from the 'deps' stage
COPY --from=deps /app/node_modules ./node_modules
# Copy the rest of the application code
COPY . .

# Set NEXT_TELEMETRY_DISABLED to 1 to disable telemetry during build.
ENV NEXT_TELEMETRY_DISABLED 1

# --- Sentry source-map upload build-args 2026-05-19 ---
# Passed in by .github/workflows/{dev,main}.yml via `docker build
# --build-arg`. When SENTRY_AUTH_TOKEN is set, next.config.mjs
# (withSentryConfig) auto-uploads source maps so production stack
# traces de-minify in Sentry. When unset, build still succeeds —
# the Sentry CLI warns + skips upload.
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SENTRY_RELEASE
ARG NEXT_PUBLIC_SENTRY_RELEASE
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN
ENV SENTRY_ORG=$SENTRY_ORG
ENV SENTRY_PROJECT=$SENTRY_PROJECT
ENV SENTRY_RELEASE=$SENTRY_RELEASE
ENV NEXT_PUBLIC_SENTRY_RELEASE=$NEXT_PUBLIC_SENTRY_RELEASE

# Build the Next.js application.
# This command requires the full dependencies (including devDependencies).
# Ensure your next.config.js or next.config.mjs includes `output: 'standalone'`
RUN yarn build

# ---- Runner Stage ----
# Create the final production image (simplified, runs as root).
FROM base AS runner
WORKDIR /app

# Set environment to production
ENV NODE_ENV production
# Disable Next.js telemetry at runtime
ENV NEXT_TELEMETRY_DISABLED 1

# Copy necessary files from the builder stage
# Copy the standalone output folder.
COPY --from=builder /app/.next/standalone ./
# Copy the static assets from the build output.
COPY --from=builder /app/.next/static ./.next/static
# Copy the public folder.
COPY --from=builder /app/public ./public

# Expose the port the app runs on (default 80 for Next.js).
EXPOSE 80

# Set the default port environment variable.
ENV PORT 80
# The standalone output server.js defaults to 0.0.0.0, which is correct for containers.
# ENV HOSTNAME 0.0.0.0

# Command to run the application using the Node.js server included in the standalone output.
# This will run as the root user.
CMD ["node", "server.js"]
