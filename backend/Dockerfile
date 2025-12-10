FROM node:22-alpine AS builder

WORKDIR /app

# Install system dependencies needed by Prisma
RUN apk add --no-cache openssl

# Install JS dependencies
COPY package*.json ./
RUN npm ci

# Copy source and config
COPY tsconfig*.json ./
COPY prisma.config.* ./
COPY prisma ./prisma
COPY src ./src

# Build Prisma client and compile TypeScript
RUN npm run prisma:generate
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Prisma also needs OpenSSL at runtime; netcat is used for DB readiness checks
RUN apk add --no-cache openssl netcat-openbsd

# Copy runtime files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.* ./

# Create writable dirs for uploads and logs
RUN mkdir -p uploads logs

EXPOSE 5000

# Run migrations and optionally seed (controlled by SEED_DB=true)
ENV SEED_DB=true
ENV DB_HOST=db
ENV DB_PORT=5432
ENV DB_WAIT_RETRIES=40
CMD ["sh", "-c", "retries=$DB_WAIT_RETRIES; until nc -z $DB_HOST $DB_PORT; do retries=$((retries-1)); if [ $retries -le 0 ]; then echo \"Database not reachable at $DB_HOST:$DB_PORT\"; exit 1; fi; echo \"Waiting for database at $DB_HOST:$DB_PORT...\"; sleep 3; done && if [ -z \"$(ls -A prisma/migrations 2>/dev/null)\" ]; then echo \"No migrations found; running prisma db push\"; npx prisma db push; else npx prisma migrate deploy; fi && if [ \"$SEED_DB\" = \"true\" ]; then node dist/prisma/seed.js; fi && node dist/server.js"]
