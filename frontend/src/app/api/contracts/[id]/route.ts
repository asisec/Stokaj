import { NextRequest } from "next/server";
import { getDb, verifyAuth, ok, err } from "@/lib/api-helpers";

type P = { params: Promise<{ id: string }> | { id: string } };

export async function GET(req: NextRequest, { params }: P) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const { id } = await params;
  const targetId = isNaN(Number(id)) ? id : Number(id);
  const sql = getDb();
  try {
    const rows = await sql`SELECT * FROM contracts WHERE id = ${targetId}`;
    if (!rows[0]) return err("Sözleşme kaydı bulunamadı", 404);
    return ok(rows[0]);
  } catch (e) {
    return err(String(e), 500);
  }
}

export async function DELETE(req: NextRequest, { params }: P) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const { id } = await params;
  const targetId = isNaN(Number(id)) ? id : Number(id);
  const sql = getDb();
  try {
    const ex = await sql`SELECT id FROM contracts WHERE id = ${targetId}`;
    if (!ex[0]) return err("Sözleşme bulunamadı", 404);
    await sql`DELETE FROM contracts WHERE id = ${targetId}`;
    return ok({ message: "Sözleşme kaydı başarıyla silindi" });
  } catch (e) {
    return err(String(e), 500);
  }
}
