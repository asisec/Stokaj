import { NextRequest } from "next/server";
import { getDb, verifyAuth, ok, err } from "@/lib/api-helpers";

type P = { params: { id: string } };

export async function GET(req: NextRequest, { params }: P) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const sql = getDb();
  try {
    const customers = await sql`SELECT * FROM customers WHERE id = ${params.id}`;
    if (!customers[0]) return err("Müşteri bulunamadı", 404);
    const sales = await sql`
      SELECT s.*, row_to_json(c.*) as customer,
        COALESCE(json_agg(DISTINCT si.*) FILTER (WHERE si.id IS NOT NULL), '[]') as items,
        COALESCE(json_agg(DISTINCT sp.*) FILTER (WHERE sp.id IS NOT NULL), '[]') as payments
      FROM sales s
      LEFT JOIN customers c ON c.id = s.customer_id
      LEFT JOIN sale_items si ON si.sale_id = s.id
      LEFT JOIN sale_payments sp ON sp.sale_id = s.id
      WHERE s.customer_id = ${params.id}
      GROUP BY s.id, c.id ORDER BY s.created_at DESC`;
    return ok({ ...customers[0], sales });
  } catch (e) { return err(String(e), 500); }
}

export async function PUT(req: NextRequest, { params }: P) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const sql = getDb();
  const body = await req.json().catch(() => null);
  if (!body) return err("Geçersiz veri formatı");
  try {
    const ex = await sql`SELECT * FROM customers WHERE id = ${params.id}`;
    if (!ex[0]) return err("Müşteri bulunamadı", 404);
    const idNum = body.identity_number || ex[0].identity_number;
    if (!/^[1-9]\d{10}$/.test(idNum)) return err("Geçersiz T.C. Kimlik Numarası");
    const rows = await sql`UPDATE customers SET first_name=${body.first_name??ex[0].first_name}, last_name=${body.last_name??ex[0].last_name}, phone=${body.phone??ex[0].phone}, email=${body.email??ex[0].email}, address=${body.address??ex[0].address}, identity_number=${idNum}, updated_at=NOW() WHERE id=${params.id} RETURNING *`;
    return ok(rows[0]);
  } catch (e) { return err(String(e), 500); }
}

export async function DELETE(req: NextRequest, { params }: P) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const sql = getDb();
  try {
    const ex = await sql`SELECT id FROM customers WHERE id = ${params.id}`;
    if (!ex[0]) return err("Müşteri bulunamadı", 404);
    await sql`DELETE FROM customers WHERE id = ${params.id}`;
    return ok({ message: "Müşteri başarıyla silindi" });
  } catch (e) { return err(String(e), 500); }
}
