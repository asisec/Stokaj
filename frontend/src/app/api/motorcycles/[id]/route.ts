import { NextRequest } from "next/server";
import { getDb, verifyAuth, ok, err } from "@/lib/api-helpers";

type P = { params: Promise<{ id: string }> | { id: string } };

export async function GET(req: NextRequest, { params }: P) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const { id } = await params;
  const targetId = isNaN(Number(id)) ? id : Number(id);
  const sql = getDb();
  try {
    const rows = await sql`SELECT * FROM motorcycles WHERE id = ${targetId}`;
    if (!rows[0]) return err("Motosiklet bulunamadı", 404);
    return ok(rows[0]);
  } catch (e) { return err(String(e), 500); }
}

export async function PUT(req: NextRequest, { params }: P) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const { id } = await params;
  const targetId = isNaN(Number(id)) ? id : Number(id);
  const sql = getDb();
  const body = await req.json().catch(() => null);
  if (!body) return err("Geçersiz veri formatı");
  try {
    const ex = await sql`SELECT * FROM motorcycles WHERE id = ${targetId}`;
    if (!ex[0]) return err("Motosiklet bulunamadı", 404);
    const rows = await sql`
      UPDATE motorcycles SET brand=${body.brand??ex[0].brand}, model=${body.model??ex[0].model}, year=${body.year??ex[0].year}, color=${body.color??ex[0].color}, chassis_number=${body.chassis_number??ex[0].chassis_number}, status=${body.status??ex[0].status}, is_other_branch=${body.is_other_branch??ex[0].is_other_branch}, branch_name=${body.branch_name??ex[0].branch_name}, updated_at=NOW() WHERE id=${targetId} RETURNING *`;
    return ok(rows[0]);
  } catch (e) { return err(String(e), 500); }
}

export async function DELETE(req: NextRequest, { params }: P) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const { id } = await params;
  const targetId = isNaN(Number(id)) ? id : Number(id);
  const sql = getDb();
  try {
    const ex = await sql`SELECT id FROM motorcycles WHERE id = ${targetId}`;
    if (!ex[0]) return err("Motosiklet bulunamadı", 404);
    await sql`DELETE FROM motorcycles WHERE id = ${targetId}`;
    return ok({ message: "Motosiklet başarıyla silindi" });
  } catch (e) { return err(String(e), 500); }
}
