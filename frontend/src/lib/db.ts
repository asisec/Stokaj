import { neon } from "@neondatabase/serverless";

let _sql: ReturnType<typeof neon> | null = null;

export function getDb() {
  if (!_sql) {
    const dbUrl = process.env.DATABASE_URL ||
      `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}?sslmode=${process.env.DB_SSLMODE || "require"}`;
    _sql = neon(dbUrl);
  }
  return _sql;
}

export const sql = new Proxy({} as ReturnType<typeof neon>, {
  get(_target, prop) {
    return (...args: unknown[]) => (getDb() as unknown as Record<string, (...a: unknown[]) => unknown>)[prop as string](...args);
  },
  apply(_target, _thisArg, args) {
    return (getDb() as unknown as (...a: unknown[]) => unknown)(...args);
  }
});

// Template literal tag
export default function db(strings: TemplateStringsArray, ...values: unknown[]) {
  return getDb()(strings, ...values);
}
