# Stage 1: Build the app
FROM node:18 AS build

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies with pnpm
RUN pnpm install --frozen-lockfile

# Copy the rest of the project files
COPY . .

# Build the application
RUN pnpm  build

# Stage 2: Production image
FROM node:18-slim AS production

WORKDIR /app

# Install pnpm globally in the production stage, if you need to run commands using pnpm
RUN npm install -g pnpm

# Copy pnpm lockfile and package manifest (optional but may be useful for pnpm)
COPY --from=build /app/package*.json ./
COPY --from=build /app/pnpm-lock.yaml ./

# Copy the production build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public

# Set production environment
ENV NODE_ENV=production

# Expose port 3000
EXPOSE 3000

# Start the app using pnpm
CMD ["pnpm", "start"]
