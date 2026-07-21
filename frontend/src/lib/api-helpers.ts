import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function verifyAuth(req: NextRequest): Promise<{ valid: boolean; error?: string }> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { valid: false, error: "Yetkilendirme başlığı eksik" };
  }
  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;
  if (!secret) return { valid: false, error: "JWT_SECRET eksik" };

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return { valid: true };
  } catch {
    return { valid: false, error: "Geçersiz veya süresi dolmuş token" };
  }
}

export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders() });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status, headers: corsHeaders() });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
