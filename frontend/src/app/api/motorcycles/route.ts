import { NextRequest } from "next/server";
import { getDb, verifyAuth, ok, err } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const sql = getDb();
  const search = req.nextUrl.searchParams.get("search") || "";
  const status = req.nextUrl.searchParams.get("status") || "";
  try {
    let rows;
    if (search && status) {
      rows = await sql`SELECT * FROM motorcycles WHERE (brand ILIKE ${"%" + search + "%"} OR model ILIKE ${"%" + search + "%"} OR chassis_number ILIKE ${"%" + search + "%"}) AND status = ${status} ORDER BY created_at DESC`;
    } else if (search) {
      rows = await sql`SELECT * FROM motorcycles WHERE brand ILIKE ${"%" + search + "%"} OR model ILIKE ${"%" + search + "%"} OR chassis_number ILIKE ${"%" + search + "%"} ORDER BY created_at DESC`;
    } else if (status) {
      rows = await sql`SELECT * FROM motorcycles WHERE status = ${status} ORDER BY created_at DESC`;
    } else {
      rows = await sql`SELECT * FROM motorcycles ORDER BY created_at DESC`;
    }
    return ok(rows);
  } catch (e) { return err(String(e), 500); }
}

export async function POST(req: NextRequest) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const sql = getDb();
  const body = await req.json().catch(() => null);
  if (!body) return err("Geçersiz veri formatı");
  try {
    const rows = await sql`
      INSERT INTO motorcycles (brand, model, year, color, chassis_number, status, purchase_price, sale_price, is_other_branch, branch_name, created_at, updated_at)
      VALUES (${body.brand}, ${body.model}, ${body.year}, ${body.color || ""}, ${body.chassis_number}, ${body.status || "available"}, ${body.purchase_price || 0}, ${body.sale_price || 0}, ${body.is_other_branch || false}, ${body.branch_name || ""}, NOW(), NOW())
      RETURNING *`;
    return ok(rows[0], 201);
  } catch (e) { return err(String(e), 500); }
}
