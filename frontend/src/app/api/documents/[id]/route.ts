import { NextRequest } from "next/server";
import { getDb, verifyAuth, ok, err } from "@/lib/api-helpers";

type P = { params: Promise<{ id: string }> | { id: string } };

export async function GET(req: NextRequest, { params }: P) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const { id } = await params;
  const targetId = isNaN(Number(id)) ? id : Number(id);
  const sql = getDb();
  try {
    const rows = await sql`
      SELECT 
        d.*,
        row_to_json(m.*) as motorcycle,
        row_to_json(c.*) as customer
      FROM registration_documents d
      LEFT JOIN motorcycles m ON m.id = d.motorcycle_id
      LEFT JOIN customers c ON c.id = d.customer_id
      WHERE d.id = ${targetId}
    `;
    if (!rows[0]) return err("Evrak kaydı bulunamadı", 404);
    return ok(rows[0]);
  } catch (e) {
    return err(String(e), 500);
  }
}

export async function PUT(req: NextRequest, { params }: P) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const { id } = await params;
  const targetId = isNaN(Number(id)) ? id : Number(id);
  const sql = getDb();
  const body = await req.json().catch(() => null);
  if (!body) return err("Geçersiz veri formatı");

  try {
    const deliveredAt = body.status === "delivered" 
      ? (body.delivered_at || new Date().toISOString()) 
      : (body.delivered_at || null);

    const rows = await sql`
      UPDATE registration_documents
      SET
        plate_number = COALESCE(${body.plate_number}, plate_number),
        registration_serial = COALESCE(${body.registration_serial}, registration_serial),
        notary_name = COALESCE(${body.notary_name}, notary_name),
        notary_doc_no = COALESCE(${body.notary_doc_no}, notary_doc_no),
        notary_date = ${body.notary_date || null},
        has_insurance = COALESCE(${body.has_insurance}, has_insurance),
        status = COALESCE(${body.status}, status),
        delivered_at = ${deliveredAt},
        notes = COALESCE(${body.notes}, notes),
        updated_at = NOW()
      WHERE id = ${targetId}
      RETURNING *
    `;

    if (!rows[0]) return err("Evrak kaydı bulunamadı", 404);

    const fullDoc = await sql`
      SELECT 
        d.*,
        row_to_json(m.*) as motorcycle,
        row_to_json(c.*) as customer
      FROM registration_documents d
      LEFT JOIN motorcycles m ON m.id = d.motorcycle_id
      LEFT JOIN customers c ON c.id = d.customer_id
      WHERE d.id = ${targetId}
    `;

    return ok(fullDoc[0]);
  } catch (e) {
    console.error("Document PUT error:", e);
    return err(String(e), 500);
  }
}

export async function DELETE(req: NextRequest, { params }: P) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const { id } = await params;
  const targetId = isNaN(Number(id)) ? id : Number(id);
  const sql = getDb();
  try {
    await sql`DELETE FROM registration_documents WHERE id = ${targetId}`;
    return ok({ message: "Evrak kaydı başarıyla silindi" });
  } catch (e) {
    return err(String(e), 500);
  }
}
