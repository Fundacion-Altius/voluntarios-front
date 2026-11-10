# voluntarios-front — multi-stage production build.
# Build-time public config (NEXT_PUBLIC_*) is injected via --build-arg in CI;
# secrets (NEXTAUTH_SECRET, Azure AD client secret, ...) are never baked in —
# they arrive as env vars at container runtime via the compose `env_file`.

# ---- deps: install everything once (dev + prod) ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN npm install -g pnpm@10 && pnpm install --frozen-lockfile

# ---- builder: compile the Next.js app ----
FROM node:20-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_IMAGE_PREFIX
ARG NEXT_PUBLIC_AZURE_AD_ENABLED
ARG NEXT_PUBLIC_TURN_HOST
ARG NEXT_PUBLIC_TURN_PORT
ARG NEXT_PUBLIC_TURN_USERNAME
ARG NEXT_PUBLIC_TURN_PASSWORD
ARG NEXT_PUBLIC_TURN_REALM
ARG NEXT_PUBLIC_WS_BASE_URL
ARG NEXTAUTH_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_IMAGE_PREFIX=$NEXT_PUBLIC_IMAGE_PREFIX \
    NEXT_PUBLIC_AZURE_AD_ENABLED=$NEXT_PUBLIC_AZURE_AD_ENABLED \
    NEXT_PUBLIC_TURN_HOST=$NEXT_PUBLIC_TURN_HOST \
    NEXT_PUBLIC_TURN_PORT=$NEXT_PUBLIC_TURN_PORT \
    NEXT_PUBLIC_TURN_USERNAME=$NEXT_PUBLIC_TURN_USERNAME \
    NEXT_PUBLIC_TURN_PASSWORD=$NEXT_PUBLIC_TURN_PASSWORD \
    NEXT_PUBLIC_TURN_REALM=$NEXT_PUBLIC_TURN_REALM \
    NEXT_PUBLIC_WS_BASE_URL=$NEXT_PUBLIC_WS_BASE_URL \
    NEXTAUTH_URL=$NEXTAUTH_URL \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm install -g pnpm@10 && pnpm run build

# ---- runner: minimal runtime (custom server.js on :3000) ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/next-env.d.ts ./next-env.d.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
EXPOSE 3000
CMD ["node", "server.js"]
