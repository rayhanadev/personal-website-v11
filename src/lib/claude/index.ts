import { get } from "@vercel/edge-config";

const TOKENS_KEY = "claudeTokens30d";

// Ray's Claude Code runs on a claude.ai Team subscription, whose token usage is
// not exposed by any Anthropic pull API available to him (the Admin/analytics
// API needs Enterprise or a Console org). A nightly local job
// (scripts/sync-claude-tokens.mjs) computes the 30-day total from the local
// ~/.claude/projects transcripts and writes it to Vercel Edge Config; here we
// just read that pre-computed value. Returns null when Edge Config is unset.
export async function fetchClaudeTokensThisMonth(): Promise<number | null> {
  if (!process.env.EDGE_CONFIG) return null;
  try {
    const value = await get(TOKENS_KEY);
    return typeof value === "number" ? value : null;
  } catch {
    return null;
  }
}
