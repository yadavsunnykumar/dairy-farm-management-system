import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      branchId: true,
      branch: { select: { id: true, name: true, code: true } },
    },
  });

  return NextResponse.json({ user: dbUser });
}
