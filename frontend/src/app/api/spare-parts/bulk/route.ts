import { NextRequest } from "next/server";
import db from "@/lib/db";
import { verifyAuth, ok, err, OPTIONS as optionsFn } from "@/lib/api-helpers";

export { optionsFn as OPTIONS };

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.valid) return err(auth.error!, 401);

  const parts = await req.json().catch(() => null);
  if (!Array.isArray(parts) || parts.length === 0) return err("Eklenecek parça bulunamadı");

  const inserted = [];
  for (const part of parts) {
    const rows = await db`
      INSERT INTO spare_parts (name, description, category, compatible_brand, compatible_model, quantity, purchase_price, sale_price, created_at, updated_at)
      VALUES (${part.name}, ${part.description || ""}, ${part.category || ""}, ${part.compatible_brand || ""}, ${part.compatible_model || ""}, ${part.quantity || 0}, ${part.purchase_price || 0}, ${part.sale_price || 0}, NOW(), NOW())
      RETURNING *
    `;
    inserted.push(rows[0]);
  }
  return ok({ message: "Toplu ekleme başarılı", count: inserted.length }, 201);
}
