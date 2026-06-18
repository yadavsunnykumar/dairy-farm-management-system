import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dairy-farm-secret"
);
const TOKEN_COOKIE = "dairy_token";

export async function signToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token) {
  const { payload } = await jwtVerify(token, SECRET);
  return payload;
}

export async function getAuthUser() {
  const cookieStore = cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

export function setTokenCookie(response, token) {
  response.cookies.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export function clearTokenCookie(response) {
  response.cookies.set(TOKEN_COOKIE, "", { maxAge: 0, path: "/" });
}

export async function requireAuth(request) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) {
    return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  try {
    const user = await verifyToken(token);
    return { user, error: null };
  } catch {
    return { user: null, error: NextResponse.json({ error: "Invalid token" }, { status: 401 }) };
  }
}

export async function requireAdmin(request) {
  const { user, error } = await requireAuth(request);
  if (error) return { user: null, error };
  if (user.role !== "ADMIN") {
    return { user: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user, error: null };
}
