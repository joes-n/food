FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json vite.config.ts tailwind.config.js postcss.config.js index.html ./
COPY src ./src

# Vite reads env vars at build time
ARG VITE_API_URL=http://localhost:5000/api
ARG VITE_SOCKET_URL=http://localhost:5000
ARG VITE_APP_NAME="Food Ordering App"
ARG VITE_APP_VERSION="1.0.0"
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_VERSION=$VITE_APP_VERSION

RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY start.sh ./start.sh
RUN chmod +x start.sh

ENV PORT=3000
EXPOSE 3000

CMD ["./start.sh"]
