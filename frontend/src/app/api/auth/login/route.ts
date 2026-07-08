import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const backendRes = await fetch(`${BACKEND_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const data = await backendRes.json()

    return NextResponse.json(data, { status: backendRes.status })
  } catch {
    return NextResponse.json(
      { error: "Sunucuya bağlanılamadı" },
      { status: 503 }
    )
  }
}
