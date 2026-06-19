import { drizzle } from "drizzle-orm/libsql/http";

import { env } from "@/env";

import { accounts } from "./schema/accounts";
import { claudeTokenDaily } from "./schema/claude-token-daily";
import * as relations from "./schema/relations";
import { sessions } from "./schema/sessions";
import { users } from "./schema/users";
import { verifications } from "./schema/verifications";

export const schema = {
  accounts,
  claudeTokenDaily,
  sessions,
  users,
  verifications,
  ...relations,
};

export const db = drizzle({
  connection: {
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  },
  schema,
});
