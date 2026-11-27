import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { isValidPostgresUrl } from "@/lib/db-url";

/**
 * Prisma client (engine-free, pg driver adapter). One instance per process;
 * reused across hot reloads in dev.
 *
 * When DATABASE_URL is unset, `db` is null and the data layer serves the
 * seed data in memory — so the site runs with zero setup.
 */
const g = globalThis as unknown as { prisma?: PrismaClient };
const connectionErrorCodes = new Set([
  "P1000", "P1001", "P1002", "P1003", "P1008", "P1010", "P1011", "P1017",
  "P2024", "P2037", "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "EHOSTUNREACH",
  "ENETUNREACH", "ENOTFOUND", "EAI_AGAIN", "57P01", "57P03",
]);
let fallbackWarningLogged = false;

function create(): PrismaClient | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!isValidPostgresUrl(url)) {
    const message = "DATABASE_URL must be a valid PostgreSQL URL with URL-encoded credentials.";
    if (process.env.NODE_ENV === "development") {
      console.warn(`${message} Using the built-in seed data.`);
      return null;
    }
    throw new Error(message);
  }

  // Serverless (Vercel) runs many instances at once, each with its own pool, all sharing
  // Supabase's pooler. Keep each pool small and let idle connections go quickly.
  // DATABASE_URL must be the transaction pooler (port 6543, ?pgbouncer=true) in production.
  const max = Number(process.env.DB_POOL_MAX) || (process.env.NODE_ENV === "production" ? 3 : 5);
  const adapter = new PrismaPg({ connectionString: url, max, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 10_000 });
  // Supabase pooler can be slow to open a transaction; wait longer than Prisma's 2s default.
  return new PrismaClient({ adapter, log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"], transactionOptions: { maxWait: 10_000, timeout: 15_000 } });
}

// One client per process (also survives hot reloads in dev and module re-evaluation in prod).
export const db: PrismaClient | null = g.prisma ?? create();
if (db) g.prisma = db;

export const hasDb = db !== null;

function getErrorCode(error: unknown): string | undefined {
  let current = error;
  const seen = new Set<object>();

  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const value = current as { code?: unknown; errorCode?: unknown; cause?: unknown };
    const code = value.errorCode ?? value.code;
    if (typeof code === "string") return code;
    current = value.cause;
  }

  return undefined;
}

export async function withDatabaseFallback<T>(
  operation: string,
  query: (client: PrismaClient) => Promise<T>,
  fallback: () => T | Promise<T>,
): Promise<T> {
  if (!db) return fallback();

  try {
    return await query(db);
  } catch (error) {
    const code = getErrorCode(error);
    const initializationFailure =
      error instanceof Error && error.name === "PrismaClientInitializationError";
    if (process.env.NODE_ENV !== "development" || (!initializationFailure && (!code || !connectionErrorCodes.has(code)))) {
      throw error;
    }

    if (!fallbackWarningLogged) {
      console.warn(`[db] ${operation} could not reach PostgreSQL; serving built-in seed data in development.`);
      fallbackWarningLogged = true;
    }
    return fallback();
  }
}
