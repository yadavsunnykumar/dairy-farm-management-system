import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const dateFilter = from && to ? { date: { gte: new Date(from), lte: new Date(to) } } : {};
  const paymentDateFilter = from && to ? { paymentDate: { gte: new Date(from), lte: new Date(to) } } : {};

  const branches = await prisma.branch.findMany({ orderBy: { name: "asc" } });

  const report = await Promise.all(
    branches.map(async (branch) => {
      const [collections, payments, milkmenCount] = await Promise.all([
        prisma.milkCollection.findMany({ where: { branchId: branch.id, ...dateFilter } }),
        prisma.payment.findMany({ where: { branchId: branch.id, ...paymentDateFilter } }),
        prisma.milkman.count({ where: { branchId: branch.id } }),
      ]);
      const totalMilk = collections.reduce((s, c) => s + c.quantity, 0);
      const totalAmount = collections.reduce((s, c) => s + c.totalAmount, 0);
      const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
      return {
        branch: { id: branch.id, name: branch.name, code: branch.code },
        milkmenCount,
        totalMilk,
        totalAmount,
        totalPaid,
        pending: totalAmount - totalPaid,
      };
    })
  );

  return NextResponse.json({ report });
}
