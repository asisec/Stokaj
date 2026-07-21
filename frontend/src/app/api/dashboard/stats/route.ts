import { NextRequest } from "next/server";
import db from "@/lib/db";
import { verifyAuth, ok, err, OPTIONS as optionsFn } from "@/lib/api-helpers";

export { optionsFn as OPTIONS };

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.valid) return err(auth.error!, 401);

  const [
    motorcycles,
    spareParts,
    sparePartsQty,
    lowStock,
    customers,
    salesCount,
    revenue,
    cost,
    receivables,
    recentSales,
    salesTrend,
    topBrands,
    customersWithBalance,
  ] = await Promise.all([
    db`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='available') as available, COUNT(*) FILTER (WHERE status='sold') as sold FROM motorcycles`,
    db`SELECT COUNT(*) as total FROM spare_parts`,
    db`SELECT COALESCE(SUM(quantity), 0) as total FROM spare_parts`,
    db`SELECT COUNT(*) as total FROM spare_parts WHERE quantity < 5`,
    db`SELECT COUNT(*) as total FROM customers`,
    db`SELECT COUNT(*) as total FROM sales`,
    db`SELECT COALESCE(SUM(total_amount), 0) as total FROM sales`,
    db`SELECT COALESCE(SUM(purchase_price * quantity), 0) as total FROM sale_items`,
    db`SELECT COALESCE(SUM(balance), 0) as total FROM customers`,
    db`
      SELECT s.*,
        row_to_json(c.*) as customer,
        COALESCE(json_agg(DISTINCT si.*) FILTER (WHERE si.id IS NOT NULL), '[]') as items,
        COALESCE(json_agg(DISTINCT sp.*) FILTER (WHERE sp.id IS NOT NULL), '[]') as payments
      FROM sales s
      LEFT JOIN customers c ON c.id = s.customer_id
      LEFT JOIN sale_items si ON si.sale_id = s.id
      LEFT JOIN sale_payments sp ON sp.sale_id = s.id
      GROUP BY s.id, c.id
      ORDER BY s.created_at DESC
      LIMIT 5
    `,
    db`
      SELECT to_char(created_at, 'YYYY-MM') as month, SUM(total_amount) as revenue
      FROM sales
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY month
      ORDER BY month
    `,
    db`
      SELECT m.brand, COUNT(si.id) as count
      FROM sale_items si
      JOIN motorcycles m ON si.item_id = m.id
      WHERE si.item_type = 'motorcycle'
      GROUP BY m.brand
      ORDER BY count DESC
      LIMIT 5
    `,
    db`SELECT * FROM customers WHERE balance > 0 ORDER BY balance DESC`,
  ]);

  return ok({
    total_motorcycles: Number(motorcycles[0].total),
    available_motorcycles: Number(motorcycles[0].available),
    sold_motorcycles: Number(motorcycles[0].sold),
    total_spare_parts: Number(spareParts[0].total),
    total_spare_parts_quantity: Number(sparePartsQty[0].total),
    low_stock_count: Number(lowStock[0].total),
    total_customers: Number(customers[0].total),
    total_sales: Number(salesCount[0].total),
    total_revenue: Number(revenue[0].total) - Number(cost[0].total),
    total_receivables: Number(receivables[0].total),
    recent_sales: recentSales,
    sales_trend: salesTrend,
    top_brands: topBrands,
    customers_with_balance: customersWithBalance,
  });
}
