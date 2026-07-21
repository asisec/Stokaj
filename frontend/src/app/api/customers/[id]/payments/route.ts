import { NextRequest } from "next/server";
import db from "@/lib/db";
import { verifyAuth, ok, err, OPTIONS as optionsFn } from "@/lib/api-helpers";

export { optionsFn as OPTIONS };

type Params = { params: { id: string } };

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await verifyAuth(req);
  if (!auth.valid) return err(auth.error!, 401);

  const body = await req.json().catch(() => null);
  if (!body?.amount || body.amount <= 0 || !body.method) return err("Geçersiz ödeme bilgileri");

  const customers = await db`SELECT * FROM customers WHERE id = ${params.id}`;
  if (!customers[0]) return err("Müşteri bulunamadı", 404);

  const customer = customers[0];
  const newBalance = Number(customer.balance) - Number(body.amount);

  await db`UPDATE customers SET balance = ${newBalance}, updated_at = NOW() WHERE id = ${params.id}`;

  const desc = body.description || "Tahsilat - " + body.method;
  await db`
    INSERT INTO customer_transactions (customer_id, type, amount, description, reference_type, created_at, updated_at)
    VALUES (${params.id}, 'credit', ${body.amount}, ${desc}, 'payment', NOW(), NOW())
  `;

  return ok({ message: "Tahsilat başarıyla kaydedildi", balance: newBalance });
}
