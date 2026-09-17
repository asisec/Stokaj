import { NextRequest } from "next/server";
import { getDb, verifyAuth, ok, err } from "@/lib/api-helpers";

async function ensureTable(sql: ReturnType<typeof getDb>) {
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
}

export async function GET(req: NextRequest) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const sql = getDb();
  await ensureTable(sql);

  const search = req.nextUrl.searchParams.get("search") || "";
  const status = req.nextUrl.searchParams.get("status") || "";

  try {
    let rows;
    if (status && status !== "all") {
      rows = await sql`
        SELECT 
          d.*,
          row_to_json(m.*) as motorcycle,
          row_to_json(c.*) as customer
        FROM registration_documents d
        LEFT JOIN motorcycles m ON m.id = d.motorcycle_id
        LEFT JOIN customers c ON c.id = d.customer_id
        WHERE d.status = ${status}
        ORDER BY d.created_at DESC
      `;
    } else {
      rows = await sql`
        SELECT 
          d.*,
          row_to_json(m.*) as motorcycle,
          row_to_json(c.*) as customer
        FROM registration_documents d
        LEFT JOIN motorcycles m ON m.id = d.motorcycle_id
        LEFT JOIN customers c ON c.id = d.customer_id
        ORDER BY d.created_at DESC
      `;
    }

    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r: any) => {
        const plate = (r.plate_number || "").toLowerCase();
        const chassis = (r.motorcycle?.chassis_number || "").toLowerCase();
        const brand = (r.motorcycle?.brand || "").toLowerCase();
        const model = (r.motorcycle?.model || "").toLowerCase();
        const customerName = `${r.customer?.first_name || ""} ${r.customer?.last_name || ""}`.toLowerCase();
        const notary = (r.notary_name || "").toLowerCase();
        return plate.includes(q) || chassis.includes(q) || brand.includes(q) || model.includes(q) || customerName.includes(q) || notary.includes(q);
      });
    }

    return ok(rows);
  } catch (e) {
    console.error("Documents GET error:", e);
    return err(String(e), 500);
  }
}

export async function POST(req: NextRequest) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const sql = getDb();
  await ensureTable(sql);

  const body = await req.json().catch(() => null);
  if (!body?.motorcycle_id || !body?.customer_id) {
    return err("Motosiklet ve Müşteri seçimi zorunludur");
  }

  try {
    const rows = await sql`
      INSERT INTO registration_documents (
        sale_id,
        motorcycle_id,
        customer_id,
        plate_number,
        registration_serial,
        notary_name,
        notary_doc_no,
        notary_date,
        has_insurance,
        status,
        delivered_at,
        notes,
        created_at,
        updated_at
      ) VALUES (
        ${body.sale_id || null},
        ${body.motorcycle_id},
        ${body.customer_id},
        ${body.plate_number || ""},
        ${body.registration_serial || ""},
        ${body.notary_name || ""},
        ${body.notary_doc_no || ""},
        ${body.notary_date || null},
        ${body.has_insurance || false},
        ${body.status || "notary_pending"},
        ${body.delivered_at || null},
        ${body.notes || ""},
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    const fullDoc = await sql`
      SELECT 
        d.*,
        row_to_json(m.*) as motorcycle,
        row_to_json(c.*) as customer
      FROM registration_documents d
      LEFT JOIN motorcycles m ON m.id = d.motorcycle_id
      LEFT JOIN customers c ON c.id = d.customer_id
      WHERE d.id = ${rows[0].id}
    `;

    return ok(fullDoc[0], 201);
  } catch (e) {
    console.error("Documents POST error:", e);
    return err(String(e), 500);
  }
}
