#!/usr/bin/env bun
// Nightly Claude Code token sync → Vercel Edge Config.
//
// Ray's Claude Code runs on a claude.ai Team subscription with no usable pull
// API, so the 30-day token total is computed locally from the transcripts in
// ~/.claude/projects and pushed to Edge Config, which the website reads.
//
// Scheduling uses Bun's native OS-level cron (`Bun.cron(path, schedule, title)`),
// which registers a launchd job (~/Library/LaunchAgents/bun.cron.<title>.plist,
// StartCalendarInterval, system-local time, survives reboot) that invokes this
// file's `scheduled()` export once per fire — no resident process.
//
//   Register/update schedule:  bun run scripts/sync-claude-tokens.ts --register
//   Remove schedule:           bun run scripts/sync-claude-tokens.ts --unregister
//   One-off run now:           bun run scripts/sync-claude-tokens.ts --once

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const WINDOW_DAYS = 30;
const EDGE_CONFIG_ID = "ecfg_qh2thouulq8vku4kejnmamd9ux1i";
const SCOPE = "rayhanadev-team";
const TOKENS_KEY = "claudeTokens30d";
const UPDATED_KEY = "claudeTokens30dUpdatedAt";
const VERCEL_BIN = "/Users/ray/.bun/bin/vercel";
const CRON_TITLE = "sync-claude-tokens";
const SCHEDULE = "0 4 * * *"; // 04:00 local (OS-level cron uses the system time zone)

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

function listJsonlFiles(root: string): string[] {
  const files: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith(".jsonl")) files.push(p);
    }
  };
  walk(root);
  return files;
}

// Tokens for one transcript line: input + output + cache (read & creation) for
// an in-window assistant message, or 0 if the line should be skipped. Messages
// that recur across transcripts (resumed/forked sessions) are de-duplicated by
// `message.id` + `requestId`, the same way ccusage does, so repeated lines
// aren't double-counted.
function lineTokens(line: string, cutoff: number, seen: Set<string>): number {
  let record: TranscriptRecord;
  try {
    record = JSON.parse(line) as TranscriptRecord;
  } catch {
    return 0;
  }
  if (record.type !== "assistant") return 0;

  const ts = record.timestamp ? Date.parse(record.timestamp) : null;
  if (ts && ts < cutoff) return 0;

  const usage = record.message?.usage;
  if (!usage) return 0;

  const dedupKey = `${record.message?.id ?? ""}:${record.requestId ?? ""}`;
  if (dedupKey !== ":") {
    if (seen.has(dedupKey)) return 0;
    seen.add(dedupKey);
  }

  return (
    (usage.input_tokens || 0) +
    (usage.output_tokens || 0) +
    (usage.cache_creation_input_tokens || 0) +
    (usage.cache_read_input_tokens || 0)
  );
}

function computeTotal(): number {
  const root = path.join(os.homedir(), ".claude", "projects");
  if (!fs.existsSync(root)) return 0;

  const cutoff = Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const seen = new Set<string>();
  let total = 0;

  for (const file of listJsonlFiles(root)) {
    let content: string;
    try {
      content = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const line of content.split("\n")) {
      if (line) total += lineTokens(line, cutoff, seen);
    }
  }

  return total;
}

function writeEdgeConfig(total: number): void {
  const patch = JSON.stringify({
    items: [
      { operation: "upsert", key: TOKENS_KEY, value: total },
      { operation: "upsert", key: UPDATED_KEY, value: new Date().toISOString() },
    ],
  });
  // Run the vercel CLI through the current Bun runtime (process.execPath) on its
  // resolved JS entry. Invoking the bin shim directly relies on its
  // `#!/usr/bin/env node` shebang, which fails under launchd's minimal PATH
  // (no `node`); Bun is already running us, so reuse it.
  const vercelJs = fs.realpathSync(VERCEL_BIN);
  execFileSync(
    process.execPath,
    [vercelJs, "edge-config", "update", EDGE_CONFIG_ID, "--patch", patch, "--scope", SCOPE],
    { stdio: "inherit" },
  );
}

function sync(): void {
  const total = computeTotal();
  console.log(
    `[sync-claude-tokens] ${new Date().toISOString()} ${TOKENS_KEY} = ${total.toLocaleString()}`,
  );
  writeEdgeConfig(total);
  console.log(`[sync-claude-tokens] wrote to Edge Config ${EDGE_CONFIG_ID}`);
}

function safeSync(): void {
  try {
    sync();
  } catch (error) {
    console.error("[sync-claude-tokens] run failed:", error);
  }
}

// Invoked by Bun's OS-level cron once per scheduled fire.
const handler = {
  scheduled() {
    safeSync();
  },
};
export default handler;

// CLI surface (only when run directly; a scheduled fire calls `scheduled()`).
if (import.meta.main) {
  const args = process.argv.slice(2);
  if (args.includes("--register")) {
    await Bun.cron(import.meta.path, SCHEDULE, CRON_TITLE);
    console.log(`[sync-claude-tokens] registered OS cron '${CRON_TITLE}' (${SCHEDULE} local)`);
  } else if (args.includes("--unregister")) {
    await Bun.cron.remove(CRON_TITLE);
    console.log(`[sync-claude-tokens] removed OS cron '${CRON_TITLE}'`);
  } else if (args.includes("--once")) {
    sync();
  }
}
