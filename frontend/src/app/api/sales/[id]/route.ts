import { NextRequest } from "next/server";
import db from "@/lib/db";
import { verifyAuth, ok, err, OPTIONS as optionsFn } from "@/lib/api-helpers";

export { optionsFn as OPTIONS };

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  const auth = await verifyAuth(req);
  if (!auth.valid) return err(auth.error!, 401);

  const rows = await db`
    SELECT s.*,
      row_to_json(c.*) as customer,
      COALESCE(json_agg(DISTINCT si.*) FILTER (WHERE si.id IS NOT NULL), '[]') as items,
      COALESCE(json_agg(DISTINCT sp.*) FILTER (WHERE sp.id IS NOT NULL), '[]') as payments
    FROM sales s
    LEFT JOIN customers c ON c.id = s.customer_id
    LEFT JOIN sale_items si ON si.sale_id = s.id
    LEFT JOIN sale_payments sp ON sp.sale_id = s.id
    WHERE s.id = ${params.id}
    GROUP BY s.id, c.id
  `;
  if (!rows[0]) return err("Satış kaydı bulunamadı", 404);
  return ok(rows[0]);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await verifyAuth(req);
  if (!auth.valid) return err(auth.error!, 401);

  const sales = await db`
    SELECT s.*, 
      COALESCE(json_agg(DISTINCT si.*) FILTER (WHERE si.id IS NOT NULL), '[]') as items,
      COALESCE(json_agg(DISTINCT sp.*) FILTER (WHERE sp.id IS NOT NULL), '[]') as payments
    FROM sales s
    LEFT JOIN sale_items si ON si.sale_id = s.id
    LEFT JOIN sale_payments sp ON sp.sale_id = s.id
    WHERE s.id = ${params.id}
    GROUP BY s.id
  `;
  if (!sales[0]) return err("Satış bulunamadı", 404);

  const sale = sales[0];

  // Revert motorcycle statuses
  if (sale.items) {
    for (const item of sale.items) {
      if (item.item_type === "motorcycle") {
        await db`UPDATE motorcycles SET status = 'available', sale_price = 0, updated_at = NOW() WHERE id = ${item.item_id}`;
      }
    }
  }

  // Revert customer balance from open_account transactions
  const transactions = await db`
    SELECT * FROM customer_transactions WHERE reference_type = 'sale' AND reference_id = ${params.id}
  `;
  for (const t of transactions) {
    if (t.type === "debt") {
      await db`UPDATE customers SET balance = balance - ${t.amount}, updated_at = NOW() WHERE id = ${sale.customer_id}`;
    }
    await db`DELETE FROM customer_transactions WHERE id = ${t.id}`;
  }

  // Delete sale items and payments
  await db`DELETE FROM sale_items WHERE sale_id = ${params.id}`;
  await db`DELETE FROM sale_payments WHERE sale_id = ${params.id}`;
  await db`DELETE FROM sales WHERE id = ${params.id}`;

  return ok({ message: "Satış başarıyla silindi" });
}
