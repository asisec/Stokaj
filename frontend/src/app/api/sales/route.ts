import { NextRequest } from "next/server";
import { getDb, verifyAuth, ok, err } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
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
      GROUP BY s.id, c.id ORDER BY s.created_at DESC`;
    return ok(rows);
  } catch (e) { return err(String(e), 500); }
}

export async function POST(req: NextRequest) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const sql = getDb();
  const body = await req.json().catch(() => null);
  if (!body?.customer_id || !body?.items?.length) return err("Geçersiz veri formatı");
  try {
    const customers = await sql`SELECT * FROM customers WHERE id = ${body.customer_id}`;
    if (!customers[0]) return err("Müşteri bulunamadı", 404);

    const saleItemsData = [];

    for (const item of body.items) {
      if (item.item_type === "motorcycle") {
        const moto = await sql`SELECT * FROM motorcycles WHERE id = ${item.item_id}`;
        if (!moto[0]) return err("Motosiklet bulunamadı", 404);
        if (moto[0].status !== "available") return err("Bu motosiklet zaten satılmış");
        saleItemsData.push({ ...item, item_name: moto[0].brand + " " + moto[0].model });
      } else if (item.item_type === "spare_part") {
        const sp = await sql`SELECT * FROM spare_parts WHERE id = ${item.item_id}`;
        if (!sp[0]) return err("Yedek parça bulunamadı", 404);
        if (sp[0].quantity < item.quantity) return err("Yetersiz stok");
        saleItemsData.push({ ...item, item_name: sp[0].name });
      } else {
        return err("Geçersiz ürün tipi");
      }
    }

    const sales = await sql`INSERT INTO sales (customer_id, total_amount, created_at) VALUES (${body.customer_id}, 0, NOW()) RETURNING *`;
    const sale = sales[0];

    for (const si of saleItemsData) {
      await sql`INSERT INTO sale_items (sale_id, item_type, item_id, item_name, quantity, unit_price, purchase_price, total_price) VALUES (${sale.id}, ${si.item_type}, ${si.item_id}, ${si.item_name}, ${si.quantity}, 0, 0, 0)`;
      if (si.item_type === "motorcycle") {
        await sql`UPDATE motorcycles SET status='sold', updated_at=NOW() WHERE id=${si.item_id}`;
        try {
          await sql`
            CREATE TABLE IF NOT EXISTS registration_documents (
              id SERIAL PRIMARY KEY,
              sale_id INT,
              motorcycle_id INT NOT NULL,
              customer_id INT NOT NULL,
              plate_number VARCHAR(50) DEFAULT '',
              registration_serial VARCHAR(50) DEFAULT '',
              notary_name VARCHAR(150) DEFAULT '',
              notary_doc_no VARCHAR(100) DEFAULT '',
              notary_date DATE,
              has_insurance BOOLEAN DEFAULT false,
              status VARCHAR(30) DEFAULT 'notary_pending',
              delivered_at TIMESTAMP,
              notes TEXT DEFAULT '',
              created_at TIMESTAMP DEFAULT NOW(),
              updated_at TIMESTAMP DEFAULT NOW()
            )
          `;
          await sql`
            INSERT INTO registration_documents (
              sale_id, motorcycle_id, customer_id, status, created_at, updated_at
            ) VALUES (
              ${sale.id}, ${si.item_id}, ${body.customer_id}, 'notary_pending', NOW(), NOW()
            )
          `;
        } catch (e) {
          console.error("Auto document creation failed:", e);
        }
      } else if (si.item_type === "spare_part") {
        await sql`UPDATE spare_parts SET quantity = quantity - ${si.quantity}, updated_at=NOW() WHERE id=${si.item_id}`;
      }
    }

    const result = await sql`
      SELECT s.*, row_to_json(c.*) as customer,
        COALESCE(json_agg(DISTINCT si.*) FILTER (WHERE si.id IS NOT NULL), '[]') as items
      FROM sales s
      LEFT JOIN customers c ON c.id = s.customer_id
      LEFT JOIN sale_items si ON si.sale_id = s.id
      WHERE s.id = ${sale.id} GROUP BY s.id, c.id`;

    return ok(result[0], 201);
  } catch (e) { return err(String(e), 500); }
}
