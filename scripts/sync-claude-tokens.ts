#!/usr/bin/env bun
// Nightly Claude Code token sync → Turso (one row per UTC day).
//
// Ray's Claude Code runs on a claude.ai Team subscription with no usable pull
// API, so token usage is computed locally from ~/.claude/projects transcripts
// and upserted, one row per UTC day, into the `claude_token_daily` table the
// website reads. Every day is recomputed each run (self-healing; keeps full
// history), so the site can sum any window — last 30d, all-time, whatever.
//
// Turso credentials come from Bun.secrets (the OS keychain), so launchd — which
// runs with a minimal env and no project cwd — can read them without a dotenv
// file. Seed the keychain once from .env.local with `--store-secrets`.
//
// Scheduling uses Bun's native OS-level cron (Bun.cron): registering writes a
// launchd job (~/Library/LaunchAgents/bun.cron.<title>.plist) that runs this
// file's `scheduled()` export daily at 04:00 local — no resident process.
//
//   Seed keychain creds:       bun run scripts/sync-claude-tokens.ts --store-secrets
//   Register/update schedule:  bun run scripts/sync-claude-tokens.ts --register
//   Remove schedule:           bun run scripts/sync-claude-tokens.ts --unregister
//   One-off run now:           bun run scripts/sync-claude-tokens.ts --once

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { secrets } from "bun";
import { createClient } from "@libsql/client";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";

import { claudeTokenDaily } from "../src/lib/db/schema/claude-token-daily";

const CRON_TITLE = "sync-claude-tokens";
const SCHEDULE = "0 4 * * *"; // 04:00 local (OS-level cron uses the system time zone)
const SECRET_SERVICE = "personal-website-v11";
const SECRET_NAMES = ["TURSO_DATABASE_URL", "TURSO_AUTH_TOKEN"] as const;

type TranscriptRecord = {
  type?: string;
  timestamp?: string;
  requestId?: string;
  message?: {
    id?: string;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
  };
};

type DayTotals = {
  input: number;
  output: number;
  cacheCreation: number;
  cacheRead: number;
};

// Read a credential from the OS keychain (Bun.secrets), falling back to the
// process env for interactive dev runs where Bun auto-loads .env.local.
async function getCredential(name: string): Promise<string | undefined> {
  return (await secrets.get({ service: SECRET_SERVICE, name })) ?? process.env[name];
}

function listJsonlFiles(root: string): string[] {
  const files: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(entryPath);
      else if (entry.name.endsWith(".jsonl")) files.push(entryPath);
    }
  };
  walk(root);
  return files;
}

// Fold one transcript line into the per-day map. Assistant messages are bucketed
// by their UTC date and de-duplicated across transcripts (resumed/forked
// sessions) by `message.id` + `requestId`, the same way ccusage does.
function accumulateLine(line: string, seen: Set<string>, byDay: Map<string, DayTotals>): void {
  let record: TranscriptRecord;
  try {
    record = JSON.parse(line) as TranscriptRecord;
  } catch {
    return;
  }
  if (record.type !== "assistant") return;

  const usage = record.message?.usage;
  if (!usage || !record.timestamp) return;

  const dedupKey = `${record.message?.id ?? ""}:${record.requestId ?? ""}`;
  if (dedupKey !== ":") {
    if (seen.has(dedupKey)) return;
    seen.add(dedupKey);
  }

  const day = record.timestamp.slice(0, 10); // "YYYY-MM-DD" (UTC)
  const totals = byDay.get(day) ?? { input: 0, output: 0, cacheCreation: 0, cacheRead: 0 };
  totals.input += usage.input_tokens || 0;
  totals.output += usage.output_tokens || 0;
  totals.cacheCreation += usage.cache_creation_input_tokens || 0;
  totals.cacheRead += usage.cache_read_input_tokens || 0;
  byDay.set(day, totals);
}

function computeDaily(): Map<string, DayTotals> {
  const root = path.join(os.homedir(), ".claude", "projects");
  const byDay = new Map<string, DayTotals>();
  if (!fs.existsSync(root)) return byDay;

  const seen = new Set<string>();
  for (const file of listJsonlFiles(root)) {
    let content: string;
    try {
      content = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const line of content.split("\n")) {
      if (line) accumulateLine(line, seen, byDay);
    }
  }
  return byDay;
}

async function syncToTurso(): Promise<void> {
  const url = await getCredential("TURSO_DATABASE_URL");
  const authToken = await getCredential("TURSO_AUTH_TOKEN");
  if (!url || !authToken) {
    throw new Error("TURSO creds missing — run `--store-secrets` to seed the keychain");
  }

  const byDay = computeDaily();
  const now = new Date();
  const rows = [...byDay.entries()].map(([date, totals]) => ({
    date,
    inputTokens: totals.input,
    outputTokens: totals.output,
    cacheCreationTokens: totals.cacheCreation,
    cacheReadTokens: totals.cacheRead,
    totalTokens: totals.input + totals.output + totals.cacheCreation + totals.cacheRead,
    updatedAt: now,
  }));

  const client = createClient({ url, authToken });
  const db = drizzle(client);
  try {
    if (rows.length) {
      await db
        .insert(claudeTokenDaily)
        .values(rows)
        .onConflictDoUpdate({
          target: claudeTokenDaily.date,
          set: {
            inputTokens: sql`excluded.input_tokens`,
            outputTokens: sql`excluded.output_tokens`,
            cacheCreationTokens: sql`excluded.cache_creation_tokens`,
            cacheReadTokens: sql`excluded.cache_read_tokens`,
            totalTokens: sql`excluded.total_tokens`,
            updatedAt: sql`excluded.updated_at`,
          },
          // A day's total only ever increases (resumed sessions get current
          // timestamps, so past days are immutable). Guarding on this means a
          // recompute from partially-pruned transcripts can't overwrite a real
          // value downward, and a missed nightly run self-heals on the next one.
          setWhere: sql`excluded.total_tokens > ${claudeTokenDaily.totalTokens}`,
        });
    }

    const allTime = rows.reduce((sum, row) => sum + row.totalTokens, 0);
    console.log(
      `[sync-claude-tokens] ${now.toISOString()} upserted ${rows.length} day(s); all-time total ${allTime.toLocaleString()}`,
    );
  } finally {
    client.close();
  }
}

// Invoked by Bun's OS-level cron once per scheduled fire; a failed run logs and
// exits cleanly instead of throwing (the next run self-heals anyway).
const handler = {
  async scheduled() {
    try {
      await syncToTurso();
    } catch (error) {
      console.error("[sync-claude-tokens] run failed:", error);
    }
  },
};
export default handler;

// CLI surface (only when run directly; a scheduled fire calls `scheduled()`).
if (import.meta.main) {
  const args = process.argv.slice(2);
  if (args.includes("--store-secrets")) {
    // Seed the keychain from the current env (Bun auto-loads .env.local in dev).
    for (const name of SECRET_NAMES) {
      const value = process.env[name];
      if (!value) throw new Error(`${name} not in env — load .env.local before --store-secrets`);
      await secrets.set({ service: SECRET_SERVICE, name, value });
    }
    console.log(`[sync-claude-tokens] stored ${SECRET_NAMES.length} creds in keychain '${SECRET_SERVICE}'`);
  } else if (args.includes("--register")) {
    await Bun.cron(import.meta.path, SCHEDULE, CRON_TITLE);
    console.log(`[sync-claude-tokens] registered OS cron '${CRON_TITLE}' (${SCHEDULE} local)`);
  } else if (args.includes("--unregister")) {
    await Bun.cron.remove(CRON_TITLE);
    console.log(`[sync-claude-tokens] removed OS cron '${CRON_TITLE}'`);
  } else if (args.includes("--once")) {
    await syncToTurso();
  }
}
