import "dotenv/config";
import { defineConfig } from "prisma/config";
import { isValidPostgresUrl } from "./src/lib/db-url";

const directDatabaseUrl = process.env["DIRECT_DATABASE_URL"]?.trim() || undefined;
const pooledDatabaseUrl = process.env["DATABASE_URL"]?.trim() || undefined;
const databaseUrl = directDatabaseUrl ?? pooledDatabaseUrl ?? "postgresql://localhost:5432/xoxo";

if (!isValidPostgresUrl(databaseUrl)) {
  const variable = directDatabaseUrl ? "DIRECT_DATABASE_URL" : "DATABASE_URL";
  throw new Error(`${variable} must be a valid PostgreSQL URL with URL-encoded credentials.`);
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations use the direct (non-pooled) URL when one is provided.
    url: databaseUrl,
  },
});
