import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || new Date().toISOString().split("T")[0];
  const to = searchParams.get("to") || from;

  const branchFilter = user.role !== "ADMIN" ? { branchId: user.branchId } : {};

  const [collections, payments] = await Promise.all([
    prisma.milkCollection.findMany({
      where: { ...branchFilter, date: { gte: new Date(from), lte: new Date(to) } },
      include: {
        milkman: { select: { id: true, name: true, code: true } },
        branch: { select: { name: true } },
      },
      orderBy: { date: "asc" },
    }),
    prisma.payment.findMany({
      where: { ...branchFilter, paymentDate: { gte: new Date(from), lte: new Date(to) } },
      include: {
        milkman: { select: { id: true, name: true, code: true } },
        branch: { select: { name: true } },
      },
      orderBy: { paymentDate: "asc" },
    }),
  ]);

  const totalMilk = collections.reduce((s, c) => s + c.quantity, 0);
  const totalAmount = collections.reduce((s, c) => s + c.totalAmount, 0);
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);

  return NextResponse.json({ collections, payments, summary: { totalMilk, totalAmount, totalPaid, pending: totalAmount - totalPaid } });
}
