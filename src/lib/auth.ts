import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const COOKIE = "dm_admin";

function sign(value: string): string {
  const secret = process.env.AUTH_SECRET || "dev";
  return createHmac("sha256", secret).update(value).digest("hex");
}

function makeToken(userId: string, email: string): string {
  const payload = Buffer.from(JSON.stringify({ id: userId, email }), "utf8").toString(
    "base64url"
  );
  return `${payload}.${sign(payload)}`;
}

function readToken(raw: string): { id: string; email: string } | null {
  const lastDot = raw.lastIndexOf(".");
  if (lastDot <= 0) return null;
  const payload = raw.slice(0, lastDot);
  const sig = raw.slice(lastDot + 1);
  if (!payload || !sig) return null;

  const expected = sign(payload);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as { id?: string; email?: string };
    if (!parsed.id || !parsed.email) return null;
    return { id: parsed.id, email: parsed.email };
  } catch {
    return null;
  }
}

export async function loginAdmin(email: string, password: string) {
  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user) return false;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return false;

  const token = makeToken(user.id, user.email);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return true;
}

export async function logoutAdmin() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getAdminSession() {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  return readToken(raw);
}
