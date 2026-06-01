import { unstable_cache } from "next/cache";

const CURSOR_API_URL = "https://api.cursor.com";
const PAGE_SIZE = 1000;
const REQUEST_DELAY_MS = 300;

type UsageEvent = {
  userEmail?: string;
  tokenUsage?: {
    inputTokens?: number;
    outputTokens?: number;
    cacheWriteTokens?: number;
    cacheReadTokens?: number;
  };
};

type FilteredUsageResponse = {
  totalUsageEventsCount: number;
  pagination: {
    numPages: number;
    currentPage: number;
    hasNextPage: boolean;
  };
  usageEvents: UsageEvent[];
};

async function _fetchCursorTokensThisMonth(
  apiKey: string,
  userEmail: string,
): Promise<number | null> {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const auth = Buffer.from(`${apiKey}:`).toString("base64");

  let totalTokens = 0;
  let page = 1;

  while (true) {
    const res = await fetch(`${CURSOR_API_URL}/teams/filtered-usage-events`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: thirtyDaysAgo,
        endDate: now,
        page,
        pageSize: PAGE_SIZE,
      }),
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = (await res.json()) as FilteredUsageResponse;

    for (const event of data.usageEvents) {
      if (event.userEmail !== userEmail) continue;
      const t = event.tokenUsage;
      if (!t) continue;
      totalTokens +=
        (t.inputTokens ?? 0) +
        (t.outputTokens ?? 0) +
        (t.cacheWriteTokens ?? 0) +
        (t.cacheReadTokens ?? 0);
    }

    if (!data.pagination.hasNextPage) break;
    page++;

    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
  }

  return totalTokens;
}

export const fetchCursorTokensThisMonth = unstable_cache(
  _fetchCursorTokensThisMonth,
  ["cursor-tokens"],
  { revalidate: 3600 },
);
