import { NextRequest } from "next/server";
import db from "@/lib/db";
import { verifyAuth, ok, err, OPTIONS as optionsFn } from "@/lib/api-helpers";

export { optionsFn as OPTIONS };

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  const auth = await verifyAuth(req);
  if (!auth.valid) return err(auth.error!, 401);

  const rows = await db`SELECT * FROM motorcycles WHERE id = ${params.id}`;
  if (!rows[0]) return err("Motosiklet bulunamadı", 404);
  return ok(rows[0]);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await verifyAuth(req);
  if (!auth.valid) return err(auth.error!, 401);

  const body = await req.json().catch(() => null);
  if (!body) return err("Geçersiz veri formatı");

  const existing = await db`SELECT * FROM motorcycles WHERE id = ${params.id}`;
  if (!existing[0]) return err("Motosiklet bulunamadı", 404);

  const rows = await db`
    UPDATE motorcycles SET
      brand = ${body.brand ?? existing[0].brand},
      model = ${body.model ?? existing[0].model},
      year = ${body.year ?? existing[0].year},
      color = ${body.color ?? existing[0].color},
      chassis_number = ${body.chassis_number ?? existing[0].chassis_number},
      engine_number = ${body.engine_number ?? existing[0].engine_number},
      status = ${body.status ?? existing[0].status},
      purchase_price = ${body.purchase_price ?? existing[0].purchase_price},
      sale_price = ${body.sale_price ?? existing[0].sale_price},
      notes = ${body.notes ?? existing[0].notes},
      updated_at = NOW()
    WHERE id = ${params.id}
    RETURNING *
  `;
  return ok(rows[0]);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await verifyAuth(req);
  if (!auth.valid) return err(auth.error!, 401);

  const existing = await db`SELECT * FROM motorcycles WHERE id = ${params.id}`;
  if (!existing[0]) return err("Motosiklet bulunamadı", 404);

  await db`DELETE FROM motorcycles WHERE id = ${params.id}`;
  return ok({ message: "Motosiklet başarıyla silindi" });
}
