import { NextRequest } from "next/server";
import db from "@/lib/db";
import { verifyAuth, ok, err, OPTIONS as optionsFn } from "@/lib/api-helpers";

export { optionsFn as OPTIONS };

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.valid) return err(auth.error!, 401);

  const search = req.nextUrl.searchParams.get("search") || "";
  let rows;
  if (search) {
    const like = "%" + search + "%";
    rows = await db`SELECT * FROM customers WHERE first_name ILIKE ${like} OR last_name ILIKE ${like} OR phone ILIKE ${like} ORDER BY created_at DESC`;
  } else {
    rows = await db`SELECT * FROM customers ORDER BY created_at DESC`;
  }
  return ok(rows);
}

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.valid) return err(auth.error!, 401);

  const body = await req.json().catch(() => null);
  if (!body) return err("Geçersiz veri formatı");

  if (!/^[1-9]\d{10}$/.test(body.identity_number || "")) {
    return err("Geçersiz T.C. Kimlik Numarası");
  }

  const rows = await db`
    INSERT INTO customers (first_name, last_name, phone, email, address, identity_number, balance, created_at, updated_at)
    VALUES (${body.first_name}, ${body.last_name}, ${body.phone || ""}, ${body.email || ""}, ${body.address || ""}, ${body.identity_number}, 0, NOW(), NOW())
    RETURNING *
  `;
  return ok(rows[0], 201);
}
