import { unstable_cache } from "next/cache";

const ANTHROPIC_API_URL = "https://api.anthropic.com";
const ANTHROPIC_VERSION = "2023-06-01";
const PAGE_LIMIT = 31;
const REQUEST_DELAY_MS = 300;

type UsageResult = {
  uncached_input_tokens?: number;
  cache_creation?: {
    ephemeral_1h_input_tokens?: number;
    ephemeral_5m_input_tokens?: number;
  };
  cache_read_input_tokens?: number;
  output_tokens?: number;
};

type UsageReportResponse = {
  data: Array<{ results: UsageResult[] }>;
  has_more: boolean;
  next_page: string | null;
};

async function _fetchClaudeTokensThisMonth(apiKey: string): Promise<number | null> {
  const now = Date.now();
  const start = new Date(now - 30 * 24 * 60 * 60 * 1000);
  start.setUTCHours(0, 0, 0, 0);
  const startingAt = start.toISOString();

  let totalTokens = 0;
  let page: string | null = null;

  while (true) {
    const params = new URLSearchParams({
      starting_at: startingAt,
      bucket_width: "1d",
      limit: String(PAGE_LIMIT),
    });
    if (page) params.set("page", page);

    const res = await fetch(
      `${ANTHROPIC_API_URL}/v1/organizations/usage_report/messages?${params}`,
      {
        method: "GET",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
        },
        cache: "no-store",
      },
    );

    if (!res.ok) return null;

    const data = (await res.json()) as UsageReportResponse;

    for (const bucket of data.data) {
      for (const r of bucket.results) {
        totalTokens +=
          (r.uncached_input_tokens ?? 0) +
          (r.cache_creation?.ephemeral_1h_input_tokens ?? 0) +
          (r.cache_creation?.ephemeral_5m_input_tokens ?? 0) +
          (r.cache_read_input_tokens ?? 0) +
          (r.output_tokens ?? 0);
      }
    }

    if (!data.has_more || !data.next_page) break;
    page = data.next_page;

    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
  }

  return totalTokens;
}

export const fetchClaudeTokensThisMonth = unstable_cache(
  _fetchClaudeTokensThisMonth,
  ["claude-tokens"],
  { revalidate: 3600 },
);
