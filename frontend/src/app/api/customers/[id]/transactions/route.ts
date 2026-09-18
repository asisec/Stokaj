import { NextRequest } from "next/server";
import { getDb, verifyAuth, ok, err } from "@/lib/api-helpers";

type P = { params: Promise<{ id: string }> | { id: string } };

export async function GET(req: NextRequest, { params }: P) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const { id } = await params;
  const sql = getDb();
  try {
    const rows = await sql`SELECT * FROM customer_transactions WHERE customer_id = ${id} ORDER BY created_at DESC`;
    return ok(rows);
  } catch (e) { return err(String(e), 500); }
}
