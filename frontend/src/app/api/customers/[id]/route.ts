import { NextRequest } from "next/server";
import db from "@/lib/db";
import { verifyAuth, ok, err, OPTIONS as optionsFn } from "@/lib/api-helpers";

export { optionsFn as OPTIONS };

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  const auth = await verifyAuth(req);
  if (!auth.valid) return err(auth.error!, 401);

  const customers = await db`SELECT * FROM customers WHERE id = ${params.id}`;
  if (!customers[0]) return err("Müşteri bulunamadı", 404);

  const sales = await db`
    SELECT s.*, 
      json_agg(DISTINCT si.*) as items,
      json_agg(DISTINCT sp.*) as payments
    FROM sales s
    LEFT JOIN sale_items si ON si.sale_id = s.id
    LEFT JOIN sale_payments sp ON sp.sale_id = s.id
    WHERE s.customer_id = ${params.id}
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `;

  return ok({ ...customers[0], sales });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await verifyAuth(req);
  if (!auth.valid) return err(auth.error!, 401);

  const body = await req.json().catch(() => null);
  if (!body) return err("Geçersiz veri formatı");

  const existing = await db`SELECT * FROM customers WHERE id = ${params.id}`;
  if (!existing[0]) return err("Müşteri bulunamadı", 404);

  if (!/^[1-9]\d{10}$/.test(body.identity_number || existing[0].identity_number)) {
    return err("Geçersiz T.C. Kimlik Numarası");
  }

  const rows = await db`
    UPDATE customers SET
      first_name = ${body.first_name ?? existing[0].first_name},
      last_name = ${body.last_name ?? existing[0].last_name},
      phone = ${body.phone ?? existing[0].phone},
      email = ${body.email ?? existing[0].email},
      address = ${body.address ?? existing[0].address},
      identity_number = ${body.identity_number ?? existing[0].identity_number},
      updated_at = NOW()
    WHERE id = ${params.id}
    RETURNING *
  `;
  return ok(rows[0]);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await verifyAuth(req);
  if (!auth.valid) return err(auth.error!, 401);

  const existing = await db`SELECT * FROM customers WHERE id = ${params.id}`;
  if (!existing[0]) return err("Müşteri bulunamadı", 404);

  await db`DELETE FROM customers WHERE id = ${params.id}`;
  return ok({ message: "Müşteri başarıyla silindi" });
}
