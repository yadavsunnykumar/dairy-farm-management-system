import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function PUT(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { name, code, address, status } = await request.json();
  const branch = await prisma.branch.update({
    where: { id: params.id },
    data: { name, code: code?.toUpperCase(), address, status },
  });
  return NextResponse.json({ branch });
}

export async function DELETE(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  await prisma.branch.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
