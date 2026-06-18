import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth";

export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const rate = await prisma.milkRate.findFirst({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ rate });
}

export async function PUT(request) {
  const { user, error } = await requireAdmin(request);
  if (error) return error;

  const { rate } = await request.json();
  if (!rate || isNaN(rate)) {
    return NextResponse.json({ error: "Valid rate is required" }, { status: 400 });
  }

  const milkRate = await prisma.milkRate.create({
    data: { rate: parseFloat(rate), setById: user.id },
    include: { setBy: { select: { id: true, name: true } } },
  });
  return NextResponse.json({ rate: milkRate });
}
