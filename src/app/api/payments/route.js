import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const milkmanId = searchParams.get("milkmanId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where = {};
  if (user.role !== "ADMIN") where.branchId = user.branchId;
  if (milkmanId) where.milkmanId = milkmanId;
  if (from || to) {
    where.paymentDate = {};
    if (from) where.paymentDate.gte = new Date(from);
    if (to) where.paymentDate.lte = new Date(to);
  }

  const payments = await prisma.payment.findMany({
    where,
    include: {
      milkman: { select: { id: true, name: true, code: true } },
      branch: { select: { id: true, name: true } },
    },
    orderBy: { paymentDate: "desc" },
  });
  return NextResponse.json({ payments });
}

export async function POST(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { milkmanId, amount, paymentDate, remarks } = await request.json();
  if (!milkmanId || !amount || !paymentDate) {
    return NextResponse.json({ error: "milkmanId, amount, and paymentDate are required" }, { status: 400 });
  }

  const milkman = await prisma.milkman.findUnique({ where: { id: milkmanId } });
  if (!milkman) return NextResponse.json({ error: "Milkman not found" }, { status: 404 });

  if (user.role !== "ADMIN" && user.branchId !== milkman.branchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payment = await prisma.payment.create({
    data: {
      milkmanId,
      branchId: milkman.branchId,
      amount: parseFloat(amount),
      paymentDate: new Date(paymentDate),
      remarks,
    },
    include: {
      milkman: { select: { id: true, name: true, code: true } },
      branch: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json({ payment }, { status: 201 });
}
