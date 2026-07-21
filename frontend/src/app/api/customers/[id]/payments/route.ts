import { NextRequest } from "next/server";
import { getDb, verifyAuth, ok, err } from "@/lib/api-helpers";

type P = { params: { id: string } };

export async function POST(req: NextRequest, { params }: P) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const sql = getDb();
  const body = await req.json().catch(() => null);
  if (!body?.amount || body.amount <= 0 || !body.method) return err("Geçersiz ödeme bilgileri");
  try {
    const customers = await sql`SELECT * FROM customers WHERE id = ${params.id}`;
    if (!customers[0]) return err("Müşteri bulunamadı", 404);
    const newBalance = Number(customers[0].balance) - Number(body.amount);
    await sql`UPDATE customers SET balance = ${newBalance}, updated_at = NOW() WHERE id = ${params.id}`;
    const desc = body.description || "Tahsilat - " + body.method;
    await sql`INSERT INTO customer_transactions (customer_id, type, amount, description, reference_type, created_at, updated_at) VALUES (${params.id}, 'credit', ${body.amount}, ${desc}, 'payment', NOW(), NOW())`;
    return ok({ message: "Tahsilat başarıyla kaydedildi", balance: newBalance });
  } catch (e) { return err(String(e), 500); }
}
