import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request, { params }) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const milkman = await prisma.milkman.findUnique({
    where: { id: params.id },
    include: {
      branch: { select: { id: true, name: true, code: true } },
      collections: { orderBy: { date: "desc" } },
      payments: { orderBy: { paymentDate: "desc" } },
    },
  });
  if (!milkman) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const totalMilk = milkman.collections.reduce((s, c) => s + c.quantity, 0);
  const totalEarned = milkman.collections.reduce((s, c) => s + c.totalAmount, 0);
  const totalPaid = milkman.payments.reduce((s, p) => s + p.amount, 0);
  const pending = totalEarned - totalPaid;

  return NextResponse.json({ milkman, ledger: { totalMilk, totalEarned, totalPaid, pending } });
}

export async function PUT(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const milkman = await prisma.milkman.findUnique({ where: { id: params.id } });
  if (!milkman) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (user.role !== "ADMIN" && user.branchId !== milkman.branchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, mobile, village, address } = await request.json();
  const updated = await prisma.milkman.update({
    where: { id: params.id },
    data: { name, mobile, village, address },
    include: { branch: { select: { id: true, name: true, code: true } } },
  });
  return NextResponse.json({ milkman: updated });
}
