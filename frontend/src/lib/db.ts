import { neon } from "@neondatabase/serverless";

export function getDb() {
  // Trim all env vars to remove accidental newlines/spaces
  const user = (process.env.DB_USER || "").trim();
  const pass = (process.env.DB_PASSWORD || "").trim();
  const host = (process.env.DB_HOST || "").trim();
  const name = (process.env.DB_NAME || "").trim();
  const ssl  = (process.env.DB_SSLMODE || "require").trim();

  const url = (process.env.DATABASE_URL || "").trim()
    || `postgresql://${user}:${encodeURIComponent(pass)}@${host}/${name}?sslmode=${ssl}`;

  return neon(url);
}
