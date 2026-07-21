import { NextRequest } from "next/server";
import { getDb, verifyAuth, ok, err } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const sql = getDb();
  const search = req.nextUrl.searchParams.get("search") || "";
  try {
    const rows = search
      ? await sql`SELECT * FROM customers WHERE first_name ILIKE ${"%" + search + "%"} OR last_name ILIKE ${"%" + search + "%"} OR phone ILIKE ${"%" + search + "%"} ORDER BY created_at DESC`
      : await sql`SELECT * FROM customers ORDER BY created_at DESC`;
    return ok(rows);
  } catch (e) { return err(String(e), 500); }
}

export async function POST(req: NextRequest) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const sql = getDb();
  const body = await req.json().catch(() => null);
  if (!body) return err("Geçersiz veri formatı");
  if (!/^[1-9]\d{10}$/.test(body.identity_number || "")) return err("Geçersiz T.C. Kimlik Numarası");
  try {
    const rows = await sql`INSERT INTO customers (first_name, last_name, phone, email, address, identity_number, balance, created_at, updated_at) VALUES (${body.first_name}, ${body.last_name}, ${body.phone||""}, ${body.email||""}, ${body.address||""}, ${body.identity_number}, 0, NOW(), NOW()) RETURNING *`;
    return ok(rows[0], 201);
  } catch (e) { return err(String(e), 500); }
}
