import { defineConfig } from '@prisma/config';

// Prisma 7 config: use a build-safe fallback so client generation works in Docker build
const databaseUrl =
  process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: databaseUrl,
  },
});
