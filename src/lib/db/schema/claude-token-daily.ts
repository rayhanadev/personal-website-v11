import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// One row per UTC day of Claude Code token usage, written nightly by
// scripts/sync-claude-tokens.ts from the local ~/.claude/projects transcripts.
// Daily breakdown is a plain select; any window (last 30d, all-time) is a SUM
// over a `date` range.
export const claudeTokenDaily = sqliteTable("claude_token_daily", {
  date: text("date").primaryKey(), // UTC day, "YYYY-MM-DD"
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  cacheCreationTokens: integer("cache_creation_tokens").notNull().default(0),
  cacheReadTokens: integer("cache_read_tokens").notNull().default(0),
  totalTokens: integer("total_tokens").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});
