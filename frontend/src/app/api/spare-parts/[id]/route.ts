import { NextRequest } from "next/server";
import { getDb, verifyAuth, ok, err } from "@/lib/api-helpers";

type P = { params: { id: string } };

export async function GET(req: NextRequest, { params }: P) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const sql = getDb();
  try {
    const rows = await sql`SELECT * FROM spare_parts WHERE id = ${params.id}`;
    if (!rows[0]) return err("Yedek parça bulunamadı", 404);
    return ok(rows[0]);
  } catch (e) { return err(String(e), 500); }
}

export async function PUT(req: NextRequest, { params }: P) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const sql = getDb();
  const body = await req.json().catch(() => null);
  if (!body) return err("Geçersiz veri formatı");
  try {
    const ex = await sql`SELECT * FROM spare_parts WHERE id = ${params.id}`;
    if (!ex[0]) return err("Yedek parça bulunamadı", 404);
    const rows = await sql`UPDATE spare_parts SET name=${body.name??ex[0].name}, description=${body.description??ex[0].description}, category=${body.category??ex[0].category}, compatible_brand=${body.compatible_brand??ex[0].compatible_brand}, compatible_model=${body.compatible_model??ex[0].compatible_model}, quantity=${body.quantity??ex[0].quantity}, is_defective=${body.is_defective??ex[0].is_defective}, updated_at=NOW() WHERE id=${params.id} RETURNING *`;
    return ok(rows[0]);
  } catch (e) { return err(String(e), 500); }
}

export async function DELETE(req: NextRequest, { params }: P) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const sql = getDb();
  try {
    const ex = await sql`SELECT id FROM spare_parts WHERE id = ${params.id}`;
    if (!ex[0]) return err("Yedek parça bulunamadı", 404);
    await sql`DELETE FROM spare_parts WHERE id = ${params.id}`;
    return ok({ message: "Yedek parça başarıyla silindi" });
  } catch (e) { return err(String(e), 500); }
}
