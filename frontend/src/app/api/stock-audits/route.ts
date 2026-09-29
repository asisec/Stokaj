import { NextRequest } from "next/server";
import { getDb, verifyAuth, ok, err } from "@/lib/api-helpers";

async function ensureTable() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS stock_audits (
      id SERIAL PRIMARY KEY,
      status VARCHAR(50) NOT NULL DEFAULT 'all_ok',
      notes TEXT DEFAULT '',
      motorcycle_count INT DEFAULT 0,
      spare_part_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

export async function GET(req: NextRequest) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const sql = getDb();
  try {
    await ensureTable();
    const audits = await sql`SELECT * FROM stock_audits ORDER BY created_at DESC LIMIT 50`;
    return ok(audits);
  } catch (e) {
    return err(String(e), 500);
  }
}

export async function POST(req: NextRequest) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const sql = getDb();
  const body = await req.json().catch(() => null);
  if (!body) return err("Geçersiz veri formatı");

  try {
    await ensureTable();
    const status = body.status || 'all_ok';
    const notes = body.notes || '';
    const motorcycleCount = Number(body.motorcycle_count) || 0;
    const sparePartCount = Number(body.spare_part_count) || 0;

    const rows = await sql`
      INSERT INTO stock_audits (status, notes, motorcycle_count, spare_part_count, created_at)
      VALUES (${status}, ${notes}, ${motorcycleCount}, ${sparePartCount}, NOW())
      RETURNING *
    `;
    return ok(rows[0], 201);
  } catch (e) {
    return err(String(e), 500);
  }
}
