import { NextRequest } from "next/server";
import { getDb, verifyAuth, ok, err } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  if (!await verifyAuth(req)) return err("Yetkisiz", 401);
  const sql = getDb();
  const search = req.nextUrl.searchParams.get("search") || "";
  try {
    const rows = search
      ? await sql`
          SELECT * FROM contracts 
          WHERE 
            customer_name ILIKE ${"%" + search + "%"} 
            OR customer_identity ILIKE ${"%" + search + "%"} 
            OR contract_no ILIKE ${"%" + search + "%"} 
            OR vehicle_chassis ILIKE ${"%" + search + "%"} 
            OR vehicle_model ILIKE ${"%" + search + "%"} 
          ORDER BY created_at DESC
        `
      : await sql`SELECT * FROM contracts ORDER BY created_at DESC`;
    return ok(rows);
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
    const rows = await sql`
      INSERT INTO contracts (
        contract_no,
        contract_date,
        customer_name,
        customer_identity,
        customer_phone,
        customer_address,
        company_name,
        company_address,
        company_tax_office,
        company_tax_no,
        company_phone,
        company_authorized,
        vehicle_brand,
        vehicle_model,
        vehicle_year,
        vehicle_color,
        vehicle_chassis,
        vehicle_engine_no,
        vehicle_km,
        vehicle_location,
        id_card_front,
        id_card_back,
        special_notes,
        created_at,
        updated_at
      ) VALUES (
        ${body.contractNo},
        ${body.contractDate || new Date().toISOString().split("T")[0]},
        ${body.customerName || ""},
        ${body.customerIdentity || ""},
        ${body.customerPhone || ""},
        ${body.customerAddress || ""},
        ${body.companyName || ""},
        ${body.companyAddress || ""},
        ${body.companyTaxOffice || ""},
        ${body.companyTaxNo || ""},
        ${body.companyPhone || ""},
        ${body.companyAuthorized || ""},
        ${body.vehicleBrand || ""},
        ${body.vehicleModel || ""},
        ${body.vehicleYear || ""},
        ${body.vehicleColor || ""},
        ${body.vehicleChassis || ""},
        ${body.vehicleEngineNo || ""},
        ${body.vehicleKm || "0"},
        ${body.vehicleLocation || "Merkez"},
        ${body.idCardFront || null},
        ${body.idCardBack || null},
        ${body.specialNotes || ""},
        NOW(),
        NOW()
      )
      ON CONFLICT (contract_no) DO UPDATE SET
        contract_date = EXCLUDED.contract_date,
        customer_name = EXCLUDED.customer_name,
        customer_identity = EXCLUDED.customer_identity,
        customer_phone = EXCLUDED.customer_phone,
        customer_address = EXCLUDED.customer_address,
        company_name = EXCLUDED.company_name,
        company_address = EXCLUDED.company_address,
        company_tax_office = EXCLUDED.company_tax_office,
        company_tax_no = EXCLUDED.company_tax_no,
        company_phone = EXCLUDED.company_phone,
        company_authorized = EXCLUDED.company_authorized,
        vehicle_brand = EXCLUDED.vehicle_brand,
        vehicle_model = EXCLUDED.vehicle_model,
        vehicle_year = EXCLUDED.vehicle_year,
        vehicle_color = EXCLUDED.vehicle_color,
        vehicle_chassis = EXCLUDED.vehicle_chassis,
        vehicle_engine_no = EXCLUDED.vehicle_engine_no,
        vehicle_km = EXCLUDED.vehicle_km,
        vehicle_location = EXCLUDED.vehicle_location,
        id_card_front = EXCLUDED.id_card_front,
        id_card_back = EXCLUDED.id_card_back,
        special_notes = EXCLUDED.special_notes,
        updated_at = NOW()
      RETURNING *
    `;
    return ok(rows[0], 201);
  } catch (e) {
    return err(String(e), 500);
  }
}
