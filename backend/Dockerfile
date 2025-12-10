FROM node:22-alpine AS builder

WORKDIR /app

# Install system dependencies needed by Prisma
RUN apk add --no-cache openssl

# Install JS dependencies
COPY package*.json ./
RUN npm ci

# Copy source and config
COPY tsconfig*.json ./
COPY prisma ./prisma
COPY src ./src

# Build Prisma client and compile TypeScript
RUN npm run prisma:generate
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Prisma also needs OpenSSL at runtime
RUN apk add --no-cache openssl

# Copy runtime files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Create writable dirs for uploads and logs
RUN mkdir -p uploads logs

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
