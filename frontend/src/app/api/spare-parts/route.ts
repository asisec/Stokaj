import { NextRequest } from "next/server";
import { getDb, verifyAuth, ok, err } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const sql = getDb();
  const search = req.nextUrl.searchParams.get("search") || "";
  try {
    const rows = search
      ? await sql`SELECT * FROM spare_parts WHERE name ILIKE ${"%" + search + "%"} OR description ILIKE ${"%" + search + "%"} OR category ILIKE ${"%" + search + "%"} OR compatible_brand ILIKE ${"%" + search + "%"} OR compatible_model ILIKE ${"%" + search + "%"} ORDER BY created_at DESC`
      : await sql`SELECT * FROM spare_parts ORDER BY created_at DESC`;
    return ok(rows);
  } catch (e) { return err(String(e), 500); }
}

export async function POST(req: NextRequest) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const sql = getDb();
  const body = await req.json().catch(() => null);
  if (!body) return err("Geçersiz veri formatı");
  try {
    const rows = await sql`INSERT INTO spare_parts (name, description, category, compatible_brand, compatible_model, quantity, purchase_price, sale_price, created_at, updated_at) VALUES (${body.name}, ${body.description||""}, ${body.category||""}, ${body.compatible_brand||""}, ${body.compatible_model||""}, ${body.quantity||0}, ${body.purchase_price||0}, ${body.sale_price||0}, NOW(), NOW()) RETURNING *`;
    return ok(rows[0], 201);
  } catch (e) { return err(String(e), 500); }
}
