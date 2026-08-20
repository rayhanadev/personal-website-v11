#!/usr/bin/env bun
/**
 * Mints ICLOUD_WEB_SESSION_JSON, the value src/lib/icloud needs to look up the
 * homepage location.
 *
 * The website can sign in to iCloud on its own, but it can't answer Apple's
 * two-factor prompt, and Apple demands one from any untrusted client. The way
 * past that is a trust token: issued once you've answered a challenge, then
 * honoured for ~30 days of 2FA-free sign-ins. This walks that challenge and
 * hands back the token.
 *
 *   bun run icloud:session
 *
 * It always forces a fresh challenge. Signing in with a live trust token would
 * succeed but hand back the *same* token, leaving the ~30-day clock untouched —
 * so a run that felt like a renewal wouldn't be one.
 *
 * Apple texts the code to the iPhone, Text Message Forwarding mirrors it into
 * Messages, and this reads it from there. That needs Full Disk Access for the
 * terminal running it.
 */
import { Database } from "bun:sqlite";

import { cancel, confirm, intro, isCancel, log, note, outro, spinner, text } from "@clack/prompts";

import { ICloudWebClient } from "../src/lib/icloud/client";

const ENV_KEY = "ICLOUD_WEB_SESSION_JSON";
const ENV_PATH = new URL("../.env", import.meta.url).pathname;
const MESSAGES_DB = `${Bun.env.HOME}/Library/Messages/chat.db`;
const APPLE_EPOCH_OFFSET_MS = Date.UTC(2001, 0, 1);
const CODE_WAIT_MS = 120_000;
const CODE_POLL_MS = 3_000;

intro("iCloud session");

const appleId = Bun.env.ICLOUD_APPLE_ID;
const password = Bun.env.ICLOUD_PASSWORD;

if (!appleId || !password) {
  cancel(`Set ICLOUD_APPLE_ID and ICLOUD_PASSWORD in ${ENV_PATH}.`);
  process.exit(1);
}

// No stored session: a fresh challenge is the only thing that mints a new token.
const client = new ICloudWebClient({ appleId, password });
const spin = spinner();

spin.start(`Signing in as ${appleId}`);
const challenge = await client.signin();
spin.stop(`Signed in as ${appleId}`);

if (challenge.status !== "two-factor-required") {
  cancel("Apple skipped the two-factor challenge, so there's no new trust token to mint.");
  process.exit(1);
}

const phone =
  challenge.trustedPhoneNumbers[0] ?? (await client.fetchAuthState()).trustedPhoneNumbers[0];

if (!phone) {
  cancel("Apple offered no trusted phone number, so there's no code to read.");
  process.exit(1);
}

const label = phone.numberWithDialCode ?? `phone #${phone.id}`;

// Sent before we start watching, so anything older in Messages is a stale code.
const sentAt = new Date();
spin.start(`Texting a code to ${label}`);
await client.sendPhoneCode(phone.id);
spin.stop(`Texted a code to ${label}`);

spin.start("Watching Messages for the code");
const code = (await watchForCode(sentAt)) ?? (await askForCode());
spin.message(`Verifying ${code}`);
await client.verifySecurityCode(code, phone.id);
await client.trustSession();
spin.stop(`Verified ${code} and trusted this Mac`);

spin.start("Checking the session can reach Find My");
await client.accountLogin();
const { content: devices } = await client.fetchFindMyDevices();
const located = devices.filter((device) => device.location);
spin.stop(`Find My returned ${devices.length} devices, ${located.length} with a location`);

const { account_country, client_id, trust_token } = client.exportSession().data ?? {};

if (!trust_token) {
  cancel("Apple did not return a trust token.");
  process.exit(1);
}

// Only the trust token outlives this run. Cookies and session tokens expire
// fast, and a stale cookie makes Apple reject the next Find My call with a 450.
const session = JSON.stringify({
  data: { account_country, client_id, trust_token },
  mintedAt: new Date().toISOString(),
});

note(session, ENV_KEY);

if (await ask("Copy it to the clipboard?")) {
  await Bun.$`echo ${session} | pbcopy`.quiet();
  log.success("Copied.");
}

if (await ask(`Write it to ${ENV_PATH}?`)) {
  await writeEnv(session);
  log.success("Written.");
}

outro(
  `Paste it as ${ENV_KEY} in Vercel > Settings > Environment Variables, then redeploy. ` +
    "Good for ~30 days.",
);

/**
 * Apple texts the code and Text Message Forwarding mirrors it here. Opened
 * read-only, scoped to inbound messages that arrived after we asked *and*
 * mention a code, so it never reads the rest of the thread — and a chatty
 * conversation can't push the code out of the result window.
 */
function readCodeFromMessages(since: Date): string | null {
  // chat.db stores dates as nanoseconds since 2001-01-01.
  const sinceNs = (since.getTime() - APPLE_EPOCH_OFFSET_MS) * 1_000_000;

  using db = new Database(MESSAGES_DB, { readonly: true, strict: true });
  const rows = db
    .query<{ body: Uint8Array | null; text: string | null }, { sinceNs: number }>(
      `select text, attributedBody as body
       from message
       where is_from_me = 0
         and date > $sinceNs
         and (text like '%code%' or text is null)
       order by date desc
       limit 20`,
    )
    .all({ sinceNs });

  for (const row of rows) {
    // Rich-text messages leave `text` null and keep the words in an
    // NSAttributedString blob, so fall back to scanning the raw bytes.
    const body = row.text ?? (row.body ? new TextDecoder("latin1").decode(row.body) : "");
    if (!/apple/i.test(body) || !/code/i.test(body)) {
      continue;
    }

    const [, found] = /\b(\d{6})\b/.exec(body) ?? [];
    if (found) {
      return found;
    }
  }

  return null;
}

async function watchForCode(since: Date): Promise<string | null> {
  const deadline = Date.now() + CODE_WAIT_MS;

  while (Date.now() < deadline) {
    const found = readCodeFromMessages(since);
    if (found) {
      return found;
    }

    await Bun.sleep(CODE_POLL_MS);
  }

  return null;
}

async function askForCode(): Promise<string> {
  spin.error("No code showed up in Messages");
  log.warn(
    "Is Text Message Forwarding on for this Mac, and does the terminal have Full Disk Access?",
  );

  const typed = await text({
    message: "Enter the six-digit code",
    validate: (value) => (/^\d{6}$/.test(value?.trim() ?? "") ? undefined : "Six digits."),
  });

  if (isCancel(typed)) {
    cancel("Cancelled.");
    process.exit(1);
  }

  spin.start("Submitting the code");
  return typed.trim();
}

async function ask(message: string): Promise<boolean> {
  const answer = await confirm({ message });

  if (isCancel(answer)) {
    cancel("Cancelled.");
    process.exit(1);
  }

  return answer;
}

async function writeEnv(value: string): Promise<void> {
  const line = `${ENV_KEY}='${value}'`;
  const file = Bun.file(ENV_PATH);
  const existing = (await file.exists()) ? await file.text() : "";
  const pattern = new RegExp(`^${ENV_KEY}=.*$`, "m");
  const next = pattern.test(existing)
    ? existing.replace(pattern, line)
    : `${existing.replace(/\n*$/, "")}\n${line}\n`.replace(/^\n/, "");

  await Bun.write(ENV_PATH, next, { mode: 0o600 });
}
