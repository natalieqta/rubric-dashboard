import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "Admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, role: true, coachName: true, createdAt: true },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "Admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { email, password, name, role, coachName } = body as {
    email?: string;
    password?: string;
    name?: string;
    role?: string;
    coachName?: string | null;
  };
  if (!email || !password || !name || !role) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (role === "Coach" && !coachName) {
    return NextResponse.json({ error: "Coach requires coachName" }, { status: 400 });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already exists" }, { status: 400 });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role,
      coachName: role === "Coach" ? coachName : null,
    },
    select: { id: true, email: true, name: true, role: true, coachName: true, createdAt: true },
  });
  return NextResponse.json(user);
}
