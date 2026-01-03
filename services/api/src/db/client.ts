import postgres from "postgres";
import { loadConfig } from "../config.js";

const cfg = loadConfig(process.env);

export const sql = cfg.DATABASE_URL
  ? postgres(cfg.DATABASE_URL, {
      max: 10,
      // Important: never log queries with secrets embedded
      debug: false
    })
  : null;

export async function withRlsUser<T>(userId: string, fn: (tx: postgres.Sql) => Promise<T>): Promise<T> {
  if (!sql) throw new Error("DATABASE_URL is not set");
  // postgres.js typing returns a widened union; keep the API strictly typed at our boundary.
  const result = await sql.begin(async (tx) => {
    // Fail-safe: if this is missing, we prefer requests to fail instead of leaking data.
    await tx`select set_config('app.user_id', ${userId}, true)`;
    return await fn(tx);
  });
  return result as unknown as T;
}

