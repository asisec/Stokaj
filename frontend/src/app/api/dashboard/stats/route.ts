import { NextRequest } from "next/server";
import { neon } from "@neondatabase/serverless";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

function getDb() {
  const url = process.env.DATABASE_URL
    || `postgresql://${process.env.DB_USER}:${encodeURIComponent(process.env.DB_PASSWORD || "")}@${process.env.DB_HOST}/${process.env.DB_NAME}?sslmode=${process.env.DB_SSLMODE || "require"}`;
  return neon(url);
}

async function auth(req: NextRequest) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return false;
  try {
    await jwtVerify(h.slice(7), new TextEncoder().encode(process.env.JWT_SECRET!));
    return true;
  } catch { return false; }
}

export async function GET(req: NextRequest) {
  if (!await auth(req)) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  
  try {
    const sql = getDb();
    const [mc, sp, spq, ls, cust, sc, rev, cost, rec, recent, trend, brands, cwb, spay, cpay] = await Promise.all([
      sql`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='available') as available, COUNT(*) FILTER (WHERE status='sold') as sold FROM motorcycles`,
      sql`SELECT COUNT(*) as total FROM spare_parts`,
      sql`SELECT COALESCE(SUM(quantity), 0) as total FROM spare_parts`,
      sql`SELECT COUNT(*) as total FROM spare_parts WHERE quantity < 5`,
      sql`SELECT COUNT(*) as total FROM customers`,
      sql`SELECT COUNT(*) as total FROM sales`,
      sql`SELECT COALESCE(SUM(total_amount), 0) as total FROM sales`,
      sql`SELECT COALESCE(SUM(purchase_price * quantity), 0) as total FROM sale_items`,
      sql`SELECT COALESCE(SUM(balance), 0) as total FROM customers WHERE balance > 0`,
      sql`
        SELECT s.*, row_to_json(c.*) as customer,
          COALESCE(json_agg(DISTINCT si.*) FILTER (WHERE si.id IS NOT NULL), '[]') as items,
          COALESCE(json_agg(DISTINCT sp.*) FILTER (WHERE sp.id IS NOT NULL), '[]') as payments
        FROM sales s
        LEFT JOIN customers c ON c.id = s.customer_id
        LEFT JOIN sale_items si ON si.sale_id = s.id
        LEFT JOIN sale_payments sp ON sp.sale_id = s.id
        GROUP BY s.id, c.id ORDER BY s.created_at DESC LIMIT 5
      `,
      sql`SELECT to_char(s.created_at, 'YYYY-MM-DD') as date, SUM(si.total_price - (si.purchase_price * si.quantity)) as revenue FROM sales s JOIN sale_items si ON s.id = si.sale_id WHERE s.created_at >= NOW() - INTERVAL '1 year' GROUP BY date ORDER BY date`,
      sql`SELECT m.brand, COUNT(si.id)::int as count FROM sale_items si JOIN motorcycles m ON si.item_id = m.id WHERE si.item_type = 'motorcycle' GROUP BY m.brand ORDER BY count DESC LIMIT 5`,
      sql`SELECT * FROM customers WHERE balance != 0 ORDER BY balance DESC`,
      sql`SELECT COALESCE(SUM(amount), 0) as total FROM sale_payments`,
      sql`SELECT COALESCE(SUM(amount), 0) as total FROM customer_transactions WHERE type = 'credit' AND reference_type = 'payment'`,
    ]);

    return NextResponse.json({
      total_motorcycles: Number(mc[0].total),
      available_motorcycles: Number(mc[0].available),
      sold_motorcycles: Number(mc[0].sold),
      total_spare_parts: Number(sp[0].total),
      total_spare_parts_quantity: Number(spq[0].total),
      low_stock_count: Number(ls[0].total),
      total_customers: Number(cust[0].total),
      total_sales: Number(sc[0].total),
      total_revenue: Number(rev[0].total) - Number(cost[0].total),
      total_receivables: Number(rec[0].total),
      recent_sales: recent,
      sales_trend: trend,
      top_brands: brands,
      customers_with_balance: cwb,
    });
  } catch (e) {
    console.error("Dashboard error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
