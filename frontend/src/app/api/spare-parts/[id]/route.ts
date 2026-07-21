import { NextRequest } from "next/server";
import db from "@/lib/db";
import { verifyAuth, ok, err, OPTIONS as optionsFn } from "@/lib/api-helpers";

export { optionsFn as OPTIONS };

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  const auth = await verifyAuth(req);
  if (!auth.valid) return err(auth.error!, 401);

  const rows = await db`SELECT * FROM spare_parts WHERE id = ${params.id}`;
  if (!rows[0]) return err("Yedek parça bulunamadı", 404);
  return ok(rows[0]);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await verifyAuth(req);
  if (!auth.valid) return err(auth.error!, 401);

  const body = await req.json().catch(() => null);
  if (!body) return err("Geçersiz veri formatı");

  const existing = await db`SELECT * FROM spare_parts WHERE id = ${params.id}`;
  if (!existing[0]) return err("Yedek parça bulunamadı", 404);

  const rows = await db`
    UPDATE spare_parts SET
      name = ${body.name ?? existing[0].name},
      description = ${body.description ?? existing[0].description},
      category = ${body.category ?? existing[0].category},
      compatible_brand = ${body.compatible_brand ?? existing[0].compatible_brand},
      compatible_model = ${body.compatible_model ?? existing[0].compatible_model},
      quantity = ${body.quantity ?? existing[0].quantity},
      purchase_price = ${body.purchase_price ?? existing[0].purchase_price},
      sale_price = ${body.sale_price ?? existing[0].sale_price},
      updated_at = NOW()
    WHERE id = ${params.id}
    RETURNING *
  `;
  return ok(rows[0]);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await verifyAuth(req);
  if (!auth.valid) return err(auth.error!, 401);

  const existing = await db`SELECT * FROM spare_parts WHERE id = ${params.id}`;
  if (!existing[0]) return err("Yedek parça bulunamadı", 404);

  await db`DELETE FROM spare_parts WHERE id = ${params.id}`;
  return ok({ message: "Yedek parça başarıyla silindi" });
}
