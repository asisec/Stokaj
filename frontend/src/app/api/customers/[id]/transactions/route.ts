import { NextRequest } from "next/server";
import db from "@/lib/db";
import { verifyAuth, ok, err, OPTIONS as optionsFn } from "@/lib/api-helpers";

export { optionsFn as OPTIONS };

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  const auth = await verifyAuth(req);
  if (!auth.valid) return err(auth.error!, 401);

  const rows = await db`
    SELECT * FROM customer_transactions WHERE customer_id = ${params.id} ORDER BY created_at DESC
  `;
  return ok(rows);
}
