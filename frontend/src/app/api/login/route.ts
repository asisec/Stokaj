import { NextRequest } from "next/server";
import { getDb, verifyAuth, ok, err } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  const { SignJWT } = await import("jose");
  const bcrypt = await import("bcryptjs");

  const body = await req.json().catch(() => null);
  if (!body?.username || !body?.password) return err("Kullanıcı adı ve şifre zorunludur");
  if (body.username !== "admin") return err("Hatalı kullanıcı adı veya şifre", 401);

  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) return err("Sunucu yapılandırma hatası", 500);

  const valid = await bcrypt.default.compare(body.password, hash);
  if (!valid) return err("Hatalı kullanıcı adı veya şifre", 401);

  const secret = process.env.JWT_SECRET;
  if (!secret) return err("JWT_SECRET eksik", 500);

  const token = await new SignJWT({ sub: "admin", iss: "stokaj" })
    .setProtectedHeader({ alg: "HS256" })
    .sign(new TextEncoder().encode(secret));

  return ok({ token });
}
