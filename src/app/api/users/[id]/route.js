import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function PUT(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { name, email, password, role, branchId } = await request.json();
  const data = { name, email, role, branchId: role === "ADMIN" ? null : branchId };
  if (password) data.password = await bcrypt.hash(password, 10);

  const user = await prisma.user.update({
    where: { id: params.id },
    data,
    select: {
      id: true, name: true, email: true, role: true, branchId: true,
      branch: { select: { id: true, name: true, code: true } },
    },
  });
  return NextResponse.json({ user });
}

export async function DELETE(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
