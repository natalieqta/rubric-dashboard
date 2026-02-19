import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "Admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const { email, name, role, coachName, password } = body as {
    email?: string;
    name?: string;
    role?: string;
    coachName?: string | null;
    password?: string;
  };
  const update: { email?: string; name?: string; role?: string; coachName?: string | null; passwordHash?: string } = {};
  if (email != null) update.email = email;
  if (name != null) update.name = name;
  if (role != null) update.role = role;
  if (coachName !== undefined) update.coachName = role === "Coach" ? coachName : null;
  if (password != null && password !== "") update.passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.update({
    where: { id },
    data: update,
    select: { id: true, email: true, name: true, role: true, coachName: true, createdAt: true },
  });
  return NextResponse.json(user);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "Admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
