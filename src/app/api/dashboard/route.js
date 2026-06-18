import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "today";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const now = new Date();
  let dateFrom, dateTo;

  if (filter === "today") {
    dateFrom = startOfDay(now);
    dateTo = endOfDay(now);
  } else if (filter === "week") {
    dateFrom = startOfWeek(now, { weekStartsOn: 1 });
    dateTo = endOfWeek(now, { weekStartsOn: 1 });
  } else if (filter === "month") {
    dateFrom = startOfMonth(now);
    dateTo = endOfMonth(now);
  } else if (filter === "custom" && from && to) {
    dateFrom = new Date(from);
    dateTo = new Date(to);
  } else {
    dateFrom = startOfDay(now);
    dateTo = endOfDay(now);
  }

  const branchFilter = user.role !== "ADMIN" ? { branchId: user.branchId } : {};

  const [collections, payments, milkmen, collectionTotals, paymentTotals] = await Promise.all([
    // Period-filtered stats
    prisma.milkCollection.findMany({
      where: { ...branchFilter, date: { gte: dateFrom, lte: dateTo } },
    }),
    prisma.payment.findMany({
      where: { ...branchFilter, paymentDate: { gte: dateFrom, lte: dateTo } },
    }),
    // All milkmen for ledger table
    prisma.milkman.findMany({
      where: branchFilter,
      include: { branch: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    // All-time per-milkman collection totals
    prisma.milkCollection.groupBy({
      by: ["milkmanId"],
      where: branchFilter,
      _sum: { quantity: true, totalAmount: true },
    }),
    // All-time per-milkman payment totals
    prisma.payment.groupBy({
      by: ["milkmanId"],
      where: branchFilter,
      _sum: { amount: true },
    }),
  ]);

  const totalMilk = collections.reduce((s, c) => s + c.quantity, 0);
  const totalAmount = collections.reduce((s, c) => s + c.totalAmount, 0);
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const pending = totalAmount - totalPaid;

  // Build milkman-wise ledger (all-time)
  const collMap = Object.fromEntries(collectionTotals.map((r) => [r.milkmanId, r._sum]));
  const payMap  = Object.fromEntries(paymentTotals.map((r) => [r.milkmanId, r._sum]));

  const milkmanLedger = milkmen.map((m) => {
    const totalEarned = collMap[m.id]?.totalAmount ?? 0;
    const totalLitres = collMap[m.id]?.quantity ?? 0;
    const totalPaidOut = payMap[m.id]?.amount ?? 0;
    const balance = totalEarned - totalPaidOut;
    return {
      id: m.id,
      name: m.name,
      code: m.code,
      branch: m.branch?.name ?? "",
      totalLitres,
      totalEarned,
      totalPaidOut,
      balance,
      settled: balance <= 0,
    };
  }).sort((a, b) => b.balance - a.balance); // highest pending first

  return NextResponse.json({
    stats: { totalMilk, totalAmount, totalPaid, pending, milkmenCount: milkmen.length },
    milkmanLedger,
    filter,
    dateFrom,
    dateTo,
  });
}
