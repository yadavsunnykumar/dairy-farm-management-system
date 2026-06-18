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
  const shift = searchParams.get("shift");

  const where = {};
  if (user.role !== "ADMIN") where.branchId = user.branchId;
  if (milkmanId) where.milkmanId = milkmanId;
  if (shift && ["MORNING", "EVENING"].includes(shift)) where.shift = shift;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }

  const collections = await prisma.milkCollection.findMany({
    where,
    include: {
      milkman: { select: { id: true, name: true, code: true } },
      branch: { select: { id: true, name: true } },
    },
    orderBy: [{ date: "desc" }, { shift: "asc" }],
  });
  return NextResponse.json({ collections });
}

export async function POST(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const body = await request.json();
  const { milkmanId, date, shift, quantity, fat, snf } = body;

  if (!milkmanId || !date || quantity == null) {
    return NextResponse.json({ error: "milkmanId, date, and quantity are required" }, { status: 400 });
  }
  if (shift && !["MORNING", "EVENING"].includes(shift)) {
    return NextResponse.json({ error: "shift must be MORNING or EVENING" }, { status: 400 });
  }

  const milkman = await prisma.milkman.findUnique({ where: { id: milkmanId } });
  if (!milkman) return NextResponse.json({ error: "Milkman not found" }, { status: 404 });

  if (user.role !== "ADMIN" && user.branchId !== milkman.branchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch latest pricing config
  const config = await prisma.pricingConfig.findFirst({ orderBy: { createdAt: "desc" } });

  let rate = 0;
  if (config?.mode === "FAT_SNF") {
    if (fat == null || snf == null) {
      return NextResponse.json({ error: "fat and snf are required for FAT_SNF pricing mode" }, { status: 400 });
    }
    rate = parseFloat(fat) * config.fatCoefficient + parseFloat(snf) * config.snfCoefficient;
  } else {
    rate = config?.flatRate ?? 0;
  }

  const totalAmount = parseFloat(quantity) * rate;

  const collection = await prisma.milkCollection.create({
    data: {
      milkmanId,
      branchId: milkman.branchId,
      date: new Date(date),
      shift: shift ?? "MORNING",
      quantity: parseFloat(quantity),
      fat: fat != null ? parseFloat(fat) : null,
      snf: snf != null ? parseFloat(snf) : null,
      rate,
      totalAmount,
    },
    include: {
      milkman: { select: { id: true, name: true, code: true } },
      branch: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json({ collection }, { status: 201 });
}
