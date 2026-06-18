import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth";

export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const config = await prisma.pricingConfig.findFirst({
    orderBy: { createdAt: "desc" },
    include: { setBy: { select: { name: true } } },
  });

  return NextResponse.json({ config });
}

export async function PUT(request) {
  const { user, error } = await requireAdmin(request);
  if (error) return error;

  const body = await request.json();
  const { mode, flatRate, fatCoefficient, snfCoefficient } = body;

  if (!mode || !["FLAT_RATE", "FAT_SNF"].includes(mode)) {
    return NextResponse.json({ error: "mode must be FLAT_RATE or FAT_SNF" }, { status: 400 });
  }
  if (mode === "FLAT_RATE" && (flatRate == null || flatRate <= 0)) {
    return NextResponse.json({ error: "flatRate is required for FLAT_RATE mode" }, { status: 400 });
  }
  if (mode === "FAT_SNF" && (fatCoefficient == null || snfCoefficient == null)) {
    return NextResponse.json({ error: "fatCoefficient and snfCoefficient are required for FAT_SNF mode" }, { status: 400 });
  }

  const config = await prisma.pricingConfig.create({
    data: {
      mode,
      flatRate: mode === "FLAT_RATE" ? parseFloat(flatRate) : null,
      fatCoefficient: mode === "FAT_SNF" ? parseFloat(fatCoefficient) : null,
      snfCoefficient: mode === "FAT_SNF" ? parseFloat(snfCoefficient) : null,
      setById: user.id,
    },
    include: { setBy: { select: { name: true } } },
  });

  return NextResponse.json({ config });
}
