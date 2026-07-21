import { NextRequest } from "next/server";
import db from "@/lib/db";
import { verifyAuth, ok, err, OPTIONS as optionsFn } from "@/lib/api-helpers";

export { optionsFn as OPTIONS };

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.valid) return err(auth.error!, 401);

  const search = req.nextUrl.searchParams.get("search") || "";
  const status = req.nextUrl.searchParams.get("status") || "";

  let rows;
  if (search && status) {
    rows = await db`SELECT * FROM motorcycles WHERE (brand ILIKE ${"%" + search + "%"} OR model ILIKE ${"%" + search + "%"} OR chassis_number ILIKE ${"%" + search + "%"}) AND status = ${status} ORDER BY created_at DESC`;
  } else if (search) {
    rows = await db`SELECT * FROM motorcycles WHERE brand ILIKE ${"%" + search + "%"} OR model ILIKE ${"%" + search + "%"} OR chassis_number ILIKE ${"%" + search + "%"} ORDER BY created_at DESC`;
  } else if (status) {
    rows = await db`SELECT * FROM motorcycles WHERE status = ${status} ORDER BY created_at DESC`;
  } else {
    rows = await db`SELECT * FROM motorcycles ORDER BY created_at DESC`;
  }
  return ok(rows);
}

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.valid) return err(auth.error!, 401);

  const body = await req.json().catch(() => null);
  if (!body) return err("Geçersiz veri formatı");

  const rows = await db`
    INSERT INTO motorcycles (brand, model, year, color, chassis_number, engine_number, status, purchase_price, sale_price, notes, created_at, updated_at)
    VALUES (${body.brand}, ${body.model}, ${body.year}, ${body.color || ""}, ${body.chassis_number}, ${body.engine_number || ""}, ${body.status || "available"}, ${body.purchase_price || 0}, ${body.sale_price || 0}, ${body.notes || ""}, NOW(), NOW())
    RETURNING *
  `;
  return ok(rows[0], 201);
}
