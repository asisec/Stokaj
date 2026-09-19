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
    const [mc, sp, spq, ls, cust, sc, recent, trend, brands] = await Promise.all([
      sql`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='available') as available, COUNT(*) FILTER (WHERE status='sold') as sold FROM motorcycles`,
      sql`SELECT COUNT(*) as total FROM spare_parts`,
      sql`SELECT COALESCE(SUM(quantity), 0) as total FROM spare_parts`,
      sql`SELECT COUNT(*) as total FROM spare_parts WHERE quantity < 5`,
      sql`SELECT COUNT(*) as total FROM customers`,
      sql`SELECT COUNT(*) as total FROM sales`,
      sql`
        SELECT s.*, row_to_json(c.*) as customer,
          COALESCE(json_agg(DISTINCT jsonb_build_object(
            'id', si.id,
            'sale_id', si.sale_id,
            'item_type', si.item_type,
            'item_id', si.item_id,
            'item_name', si.item_name,
            'quantity', si.quantity,
            'chassis_number', m.chassis_number
          )) FILTER (WHERE si.id IS NOT NULL), '[]') as items
        FROM sales s
        LEFT JOIN customers c ON c.id = s.customer_id
        LEFT JOIN sale_items si ON si.sale_id = s.id
        LEFT JOIN motorcycles m ON (si.item_type = 'motorcycle' AND si.item_id = m.id)
        GROUP BY s.id, c.id ORDER BY s.created_at DESC LIMIT 5
      `,
      sql`SELECT to_char(s.created_at, 'YYYY-MM-DD') as date, SUM(si.quantity) as sales_count FROM sales s JOIN sale_items si ON s.id = si.sale_id WHERE s.created_at >= NOW() - INTERVAL '1 year' GROUP BY date ORDER BY date`,
      sql`SELECT m.brand, COUNT(si.id)::int as count FROM sale_items si JOIN motorcycles m ON si.item_id = m.id WHERE si.item_type = 'motorcycle' GROUP BY m.brand ORDER BY count DESC LIMIT 5`
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
      recent_sales: recent,
      sales_trend: trend,
      top_brands: brands
    });
  } catch (e) {
    console.error("Dashboard error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
