import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { jwtVerify } from "jose";

export function getDb() {
  const url = process.env.DATABASE_URL
    || `postgresql://${process.env.DB_USER}:${encodeURIComponent(process.env.DB_PASSWORD || "")}@${process.env.DB_HOST}/${process.env.DB_NAME}?sslmode=${process.env.DB_SSLMODE || "require"}`;
  const sql = neon(url);
  return function(strings: TemplateStringsArray, ...values: any[]) {
    const cleanValues = values.map(v => v === undefined ? null : v);
    return sql(strings, ...cleanValues);
  } as typeof sql;
}

export async function verifyAuth(req: NextRequest): Promise<boolean> {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return false;
  try {
    await jwtVerify(h.slice(7), new TextEncoder().encode(process.env.JWT_SECRET!));
    return true;
  } catch { return false; }
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
