# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace config and lockfile
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY tsconfig.json ./
COPY packages/shared/tsconfig.json packages/shared/
COPY packages/shared/src packages/shared/src/
COPY packages/server/tsconfig.json packages/server/
COPY packages/server/src packages/server/src/

# Build shared then server
RUN npm run build -w packages/shared
RUN npm run build -w packages/server

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy workspace config and lockfile
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built files from builder
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/packages/server/dist packages/server/dist

EXPOSE 8080

CMD ["node", "packages/server/dist/index.js"]
