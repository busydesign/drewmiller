import "dotenv/config";
import { defineConfig } from "prisma/config";

// Placeholder is only used so `prisma generate` works at install/build time
// when DATABASE_URL is not injected yet (e.g. Railway npm ci).
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:5432/drewmiller?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: databaseUrl,
  },
});
