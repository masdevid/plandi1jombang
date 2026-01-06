# Multi-stage Docker build for SDN Plandi application

# Stage 1: Build Angular application
FROM node:20-alpine AS angular-builder

WORKDIR /app

# Install pnpm using corepack
RUN corepack enable && corepack prepare pnpm@10.26.2 --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build Angular application
RUN pnpm build

# Stage 2: Production server
FROM node:20-alpine

WORKDIR /app

# Install pnpm using corepack
RUN corepack enable && corepack prepare pnpm@10.26.2 --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only (including postgres for local DB)
RUN pnpm install --prod --frozen-lockfile

# Copy API code
COPY api ./api

# Copy server file
COPY server.js ./

# Copy built Angular app from builder stage
COPY --from=angular-builder /app/dist ./dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3000

# Environment variables (can be overridden by docker-compose or docker run)
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/ping', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "server.js"]
