import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * ローカル開発時は DIRECT_URL (Supabase 直接接続 port 5432) を優先する。
 *
 * 理由: Supabase の Transaction-mode Pooler (port 6543) は ?pgbouncer=true を
 * 付けても、高い並列度 (Promise.all で同時実行) でクエリを投げると
 * "prepared statement does not exist" エラーが頻発する。
 * Direct 接続なら prepared statement が安定して動く。
 *
 * 本番 (Vercel) では DIRECT_URL を設定しない (もしくは設定しても DATABASE_URL
 * のみ使う) ことで、サーバーレス向けに Pooler 経由の接続を維持する。
 */
const datasourceUrl =
  process.env.NODE_ENV === "production"
    ? process.env.DATABASE_URL
    : (process.env.DIRECT_URL ?? process.env.DATABASE_URL);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
