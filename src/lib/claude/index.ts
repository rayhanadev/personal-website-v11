import { desc, gte, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { claudeTokenDaily } from "@/lib/db/schema/claude-token-daily";

// UTC date ("YYYY-MM-DD") `days` days before now — matches the per-day keys
// written by scripts/sync-claude-tokens.ts.
function utcDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// Total Claude Code tokens (input + output + cache) over the last 30 days,
// summed from the per-day table. Returns null on error.
export async function fetchClaudeTokensThisMonth(): Promise<number | null> {
  try {
    const [row] = await db
      .select({ total: sql<number>`coalesce(sum(${claudeTokenDaily.totalTokens}), 0)` })
      .from(claudeTokenDaily)
      .where(gte(claudeTokenDaily.date, utcDaysAgo(30)));
    return Number(row?.total ?? 0);
  } catch {
    return null;
  }
}

// Per-day breakdown for the last `days` days (default 30), newest first.
export function fetchClaudeTokensDaily(days = 30) {
  return db
    .select()
    .from(claudeTokenDaily)
    .where(gte(claudeTokenDaily.date, utcDaysAgo(days)))
    .orderBy(desc(claudeTokenDaily.date));
}
