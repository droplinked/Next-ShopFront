# Simplified Dockerfile for Next.js Production Deployment (Standalone Output)

# ---- Base Stage ----
# Use a specific Node.js version on Alpine Linux for a small base image.
FROM node:20-alpine AS base

# ---- Dependencies Stage ----
# Install dependencies first to leverage Docker cache.
FROM base AS deps
WORKDIR /app

# Copy package.json and lock file
# If using npm, copy package.json and package-lock.json
COPY package.json yarn.lock* ./

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
CMD ["npm", "run", "prod"]
