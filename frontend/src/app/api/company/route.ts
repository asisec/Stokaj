import { NextRequest } from "next/server";
import { getDb, verifyAuth, ok, err } from "@/lib/api-helpers";

async function ensureTable(sql: ReturnType<typeof getDb>) {
  await sql`
    CREATE TABLE IF NOT EXISTS company_info (
      id INT PRIMARY KEY DEFAULT 1,
      company_name VARCHAR(255) DEFAULT 'VOLKAN MOTOR & OTOMOTİV',
      company_address TEXT DEFAULT 'ÖZKÖK APT ÖZKÖK, Topraklık, Halk Cd. APT. NO: 50 İÇ KAPI NO: 1, 20170 Pamukkale/Denizli',
      company_tax_office VARCHAR(100) DEFAULT '',
      company_tax_no VARCHAR(50) DEFAULT '',
      company_phone VARCHAR(50) DEFAULT '+90 533 632 58 89',
      company_authorized VARCHAR(100) DEFAULT 'Firma Yetkilisi',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  const rows = await sql`SELECT id FROM company_info WHERE id = 1`;
  if (rows.length === 0) {
    await sql`
      INSERT INTO company_info (
        id, company_name, company_address, company_tax_office, company_tax_no, company_phone, company_authorized
      ) VALUES (
        1,
        'VOLKAN MOTOR & OTOMOTİV',
        'ÖZKÖK APT ÖZKÖK, Topraklık, Halk Cd. APT. NO: 50 İÇ KAPI NO: 1, 20170 Pamukkale/Denizli',
        '',
        '',
        '+90 533 632 58 89',
        'Firma Yetkilisi'
      )
    `;
  }
}

export async function GET(req: NextRequest) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const sql = getDb();
  await ensureTable(sql);

  try {
    const rows = await sql`SELECT * FROM company_info WHERE id = 1`;
    return ok(rows[0] || {});
  } catch (e) {
    console.error("Company GET error:", e);
    return err(String(e), 500);
  }
}

export async function POST(req: NextRequest) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const sql = getDb();
  await ensureTable(sql);

  const body = await req.json().catch(() => null);
  if (!body) return err("Geçersiz veri formatı");

  try {
    const rows = await sql`
      INSERT INTO company_info (
        id,
        company_name,
        company_address,
        company_tax_office,
        company_tax_no,
        company_phone,
        company_authorized,
        updated_at
      ) VALUES (
        1,
        ${body.company_name || ""},
        ${body.company_address || ""},
        ${body.company_tax_office || ""},
        ${body.company_tax_no || ""},
        ${body.company_phone || ""},
        ${body.company_authorized || ""},
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        company_address = EXCLUDED.company_address,
        company_tax_office = EXCLUDED.company_tax_office,
        company_tax_no = EXCLUDED.company_tax_no,
        company_phone = EXCLUDED.company_phone,
        company_authorized = EXCLUDED.company_authorized,
        updated_at = NOW()
      RETURNING *
    `;

    return ok(rows[0]);
  } catch (e) {
    console.error("Company POST error:", e);
    return err(String(e), 500);
  }
}
