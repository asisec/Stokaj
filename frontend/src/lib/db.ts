import { neon } from "@neondatabase/serverless";

function createDb() {
  // Neon requires the full connection string
  const url = process.env.DATABASE_URL
    || `postgresql://${process.env.DB_USER}:${encodeURIComponent(process.env.DB_PASSWORD || "")}@${process.env.DB_HOST}/${process.env.DB_NAME}?sslmode=${process.env.DB_SSLMODE || "require"}`;
  return neon(url);
}

// Create a tagged template literal function for SQL queries
export default function db(strings: TemplateStringsArray, ...values: unknown[]) {
  const sql = createDb();
  return sql(strings, ...values);
}
