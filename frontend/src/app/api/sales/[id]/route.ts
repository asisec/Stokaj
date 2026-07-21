import { NextRequest } from "next/server";
import { getDb, verifyAuth, ok, err } from "@/lib/api-helpers";

type P = { params: { id: string } };

export async function GET(req: NextRequest, { params }: P) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const sql = getDb();
  try {
    const rows = await sql`
      SELECT s.*, row_to_json(c.*) as customer,
        COALESCE(json_agg(DISTINCT si.*) FILTER (WHERE si.id IS NOT NULL), '[]') as items,
        COALESCE(json_agg(DISTINCT sp.*) FILTER (WHERE sp.id IS NOT NULL), '[]') as payments
      FROM sales s
      LEFT JOIN customers c ON c.id = s.customer_id
      LEFT JOIN sale_items si ON si.sale_id = s.id
      LEFT JOIN sale_payments sp ON sp.sale_id = s.id
      WHERE s.id = ${params.id} GROUP BY s.id, c.id`;
    if (!rows[0]) return err("Satış kaydı bulunamadı", 404);
    return ok(rows[0]);
  } catch (e) { return err(String(e), 500); }
}

export async function DELETE(req: NextRequest, { params }: P) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const sql = getDb();
  try {
    const sales = await sql`
      SELECT s.*, COALESCE(json_agg(DISTINCT si.*) FILTER (WHERE si.id IS NOT NULL), '[]') as items
      FROM sales s LEFT JOIN sale_items si ON si.sale_id = s.id
      WHERE s.id = ${params.id} GROUP BY s.id`;
    if (!sales[0]) return err("Satış bulunamadı", 404);
    const sale = sales[0];

    if (Array.isArray(sale.items)) {
      for (const item of sale.items) {
        if (item.item_type === "motorcycle") {
          await sql`UPDATE motorcycles SET status='available', sale_price=0, updated_at=NOW() WHERE id=${item.item_id}`;
        }
      }
    }

    const transactions = await sql`SELECT * FROM customer_transactions WHERE reference_type='sale' AND reference_id=${params.id}`;
    for (const t of transactions) {
      if (t.type === "debt") await sql`UPDATE customers SET balance=balance-${t.amount}, updated_at=NOW() WHERE id=${sale.customer_id}`;
      await sql`DELETE FROM customer_transactions WHERE id=${t.id}`;
    }

    await sql`DELETE FROM sale_items WHERE sale_id=${params.id}`;
    await sql`DELETE FROM sale_payments WHERE sale_id=${params.id}`;
    await sql`DELETE FROM sales WHERE id=${params.id}`;
    return ok({ message: "Satış başarıyla silindi" });
  } catch (e) { return err(String(e), 500); }
}
