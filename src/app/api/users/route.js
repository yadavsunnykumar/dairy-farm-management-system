import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      branchId: true,
      branch: { select: { id: true, name: true, code: true } },
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ users });
}

export async function POST(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { name, email, password, role, branchId } = await request.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email, and password required" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: role || "USER",
      branchId: role === "ADMIN" ? null : branchId,
    },
    select: {
      id: true, name: true, email: true, role: true, branchId: true,
      branch: { select: { id: true, name: true, code: true } },
    },
  });
  return NextResponse.json({ user }, { status: 201 });
}
