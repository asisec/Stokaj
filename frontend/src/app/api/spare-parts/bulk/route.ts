import { NextRequest } from "next/server";
import { getDb, verifyAuth, ok, err } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const sql = getDb();
  const parts = await req.json().catch(() => null);
  if (!Array.isArray(parts) || parts.length === 0) return err("Eklenecek parça bulunamadı");
  try {
    const inserted = [];
    for (const p of parts) {
      const rows = await sql`INSERT INTO spare_parts (name, description, category, compatible_brand, compatible_model, quantity, purchase_price, sale_price, created_at, updated_at) VALUES (${p.name}, ${p.description||""}, ${p.category||""}, ${p.compatible_brand||""}, ${p.compatible_model||""}, ${p.quantity||0}, ${p.purchase_price||0}, ${p.sale_price||0}, NOW(), NOW()) RETURNING *`;
      inserted.push(rows[0]);
    }
    return ok({ message: "Toplu ekleme başarılı", count: inserted.length }, 201);
  } catch (e) { return err(String(e), 500); }
}
