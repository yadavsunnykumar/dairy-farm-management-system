import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const branchId = searchParams.get("branchId");

  const where = {};
  if (user.role !== "ADMIN") where.branchId = user.branchId;
  else if (branchId) where.branchId = branchId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
      { mobile: { contains: search, mode: "insensitive" } },
    ];
  }

  const milkmen = await prisma.milkman.findMany({
    where,
    include: { branch: { select: { id: true, name: true, code: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ milkmen });
}

export async function POST(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { name, mobile, village, address, branchId } = await request.json();
  if (!name || !branchId) {
    return NextResponse.json({ error: "Name and branch are required" }, { status: 400 });
  }

  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

  if (user.role !== "ADMIN" && user.branchId !== branchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existingCount = await prisma.milkman.count({
    where: { code: { startsWith: branch.code + "-" } },
  });
  const seq = existingCount + 1;
  const code = `${branch.code}-${String(seq).padStart(3, "0")}`;

  const milkman = await prisma.milkman.create({
    data: { name, mobile, village, address, branchId, code },
    include: { branch: { select: { id: true, name: true, code: true } } },
  });
  return NextResponse.json({ milkman }, { status: 201 });
}
