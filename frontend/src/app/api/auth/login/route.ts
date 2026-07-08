import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // On Vercel (server-side), relative URLs don't work.
    // We use the request's own host + the vercel rewrite path to reach the backend.
    // On Docker/local, we call the backend directly.
    let backendUrl: string
    if (process.env.VERCEL) {
      const host = req.headers.get("host") || ""
      const protocol = host.includes("localhost") ? "http" : "https"
      backendUrl = `${protocol}://${host}/api/backend/api/login`
    } else {
      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
      backendUrl = `${base}/api/login`
    }

    const backendRes = await fetch(backendUrl, {
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
