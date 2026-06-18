import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request, { params }) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const dateFilter = from && to ? { gte: new Date(from), lte: new Date(to) } : undefined;

  const milkman = await prisma.milkman.findUnique({
    where: { id: params.id },
    include: {
      branch: { select: { id: true, name: true, code: true } },
      collections: {
        where: dateFilter ? { date: dateFilter } : {},
        orderBy: { date: "asc" },
      },
      payments: {
        where: dateFilter ? { paymentDate: dateFilter } : {},
        orderBy: { paymentDate: "asc" },
      },
    },
  });

  if (!milkman) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const totalMilk = milkman.collections.reduce((s, c) => s + c.quantity, 0);
  const totalEarned = milkman.collections.reduce((s, c) => s + c.totalAmount, 0);
  const totalPaid = milkman.payments.reduce((s, p) => s + p.amount, 0);

  return NextResponse.json({
    milkman,
    ledger: { totalMilk, totalEarned, totalPaid, pending: totalEarned - totalPaid },
  });
}
