import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const sql = getDb();
    
    // Convert names and categories to uppercase
    await sql`
      UPDATE spare_parts 
      SET 
        name = UPPER(name),
        category = UPPER(category)
    `;

    return NextResponse.json({ success: true, message: "Yedek parçalar başarıyla büyük harfe çevrildi." });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: "Failed to run migration" }, { status: 500 });
  }
}
