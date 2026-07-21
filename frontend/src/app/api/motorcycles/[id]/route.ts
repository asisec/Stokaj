import { NextRequest } from "next/server";
import { getDb, verifyAuth, ok, err } from "@/lib/api-helpers";

type P = { params: { id: string } };

export async function GET(req: NextRequest, { params }: P) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const sql = getDb();
  try {
    const rows = await sql`SELECT * FROM motorcycles WHERE id = ${params.id}`;
    if (!rows[0]) return err("Motosiklet bulunamadı", 404);
    return ok(rows[0]);
  } catch (e) { return err(String(e), 500); }
}

export async function PUT(req: NextRequest, { params }: P) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const sql = getDb();
  const body = await req.json().catch(() => null);
  if (!body) return err("Geçersiz veri formatı");
  try {
    const ex = await sql`SELECT * FROM motorcycles WHERE id = ${params.id}`;
    if (!ex[0]) return err("Motosiklet bulunamadı", 404);
    const rows = await sql`
      UPDATE motorcycles SET brand=${body.brand??ex[0].brand}, model=${body.model??ex[0].model}, year=${body.year??ex[0].year}, color=${body.color??ex[0].color}, chassis_number=${body.chassis_number??ex[0].chassis_number}, status=${body.status??ex[0].status}, purchase_price=${body.purchase_price??ex[0].purchase_price}, sale_price=${body.sale_price??ex[0].sale_price}, is_other_branch=${body.is_other_branch??ex[0].is_other_branch}, branch_name=${body.branch_name??ex[0].branch_name}, updated_at=NOW() WHERE id=${params.id} RETURNING *`;
    return ok(rows[0]);
  } catch (e) { return err(String(e), 500); }
}

export async function DELETE(req: NextRequest, { params }: P) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const sql = getDb();
  try {
    const ex = await sql`SELECT id FROM motorcycles WHERE id = ${params.id}`;
    if (!ex[0]) return err("Motosiklet bulunamadı", 404);
    await sql`DELETE FROM motorcycles WHERE id = ${params.id}`;
    return ok({ message: "Motosiklet başarıyla silindi" });
  } catch (e) { return err(String(e), 500); }
}
