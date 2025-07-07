# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    bash \
    wget \
    curl

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Build static frontend for port 8080
# The WebSocket URL will be configured at runtime
ENV WEBSOCKET_SERVER_URL=ws://localhost:3000
ENV ALLOWED_ORIGINS=*
RUN npm run build-static:prod

# Copy and make startup script executable
COPY scripts/start-servers.sh /app/start-servers.sh
RUN chmod +x /app/start-servers.sh

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Change ownership of app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose both ports
EXPOSE 3000 8080

# Health check for both services
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ && \
      wget --no-verbose --tries=1 --spider http://localhost:3000/socket.io/ || exit 1

# Set default environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV STATIC_PORT=8080

# Start both servers using the robust script
CMD ["/app/start-servers.sh"]
