import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth";

export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const branches = await prisma.branch.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ branches });
}

export async function POST(request) {
  const { user, error } = await requireAdmin(request);
  if (error) return error;

  const { name, code, address, status } = await request.json();
  if (!name || !code) {
    return NextResponse.json({ error: "Name and code are required" }, { status: 400 });
  }

  const branch = await prisma.branch.create({
    data: { name, code: code.toUpperCase(), address, status: status || "ACTIVE" },
  });
  return NextResponse.json({ branch }, { status: 201 });
}
