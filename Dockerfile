# Node.js 22 LTS. Dependabot opens a pull request when a newer image is published.
FROM node:25-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1

# Install exact versions from package-lock.json. --ignore-scripts blocks
# install-script supply-chain attacks.
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runtime image: only the standalone server, no source code or dev tools.
# Files are owned by root and read-only to the app; docker-compose runs the
# container as your PUID:PGID (default: the image's non-root "node" user).
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
