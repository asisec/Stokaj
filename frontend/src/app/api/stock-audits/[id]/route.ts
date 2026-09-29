import { NextRequest } from "next/server";
import { getDb, verifyAuth, ok, err } from "@/lib/api-helpers";

type P = { params: Promise<{ id: string }> | { id: string } };

export async function DELETE(req: NextRequest, { params }: P) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const { id } = await params;
  const targetId = Number(id);
  if (isNaN(targetId)) return err("Geçersiz ID", 400);

  const sql = getDb();
  try {
    await sql`DELETE FROM stock_audits WHERE id = ${targetId}`;
    return ok({ message: "Stok kontrol kaydı silindi" });
  } catch (e) {
    return err(String(e), 500);
  }
}
