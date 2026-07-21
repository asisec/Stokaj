import { NextRequest } from "next/server";
import db from "@/lib/db";
import { verifyAuth, ok, err, OPTIONS as optionsFn } from "@/lib/api-helpers";

export { optionsFn as OPTIONS };

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.valid) return err(auth.error!, 401);

  const search = req.nextUrl.searchParams.get("search") || "";
  let rows;
  if (search) {
    const like = "%" + search + "%";
    rows = await db`SELECT * FROM spare_parts WHERE name ILIKE ${like} OR description ILIKE ${like} OR category ILIKE ${like} OR compatible_brand ILIKE ${like} OR compatible_model ILIKE ${like} ORDER BY created_at DESC`;
  } else {
    rows = await db`SELECT * FROM spare_parts ORDER BY created_at DESC`;
  }
  return ok(rows);
}

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.valid) return err(auth.error!, 401);

  const body = await req.json().catch(() => null);
  if (!body) return err("Geçersiz veri formatı");

  const rows = await db`
    INSERT INTO spare_parts (name, description, category, compatible_brand, compatible_model, quantity, purchase_price, sale_price, created_at, updated_at)
    VALUES (${body.name}, ${body.description || ""}, ${body.category || ""}, ${body.compatible_brand || ""}, ${body.compatible_model || ""}, ${body.quantity || 0}, ${body.purchase_price || 0}, ${body.sale_price || 0}, NOW(), NOW())
    RETURNING *
  `;
  return ok(rows[0], 201);
}
