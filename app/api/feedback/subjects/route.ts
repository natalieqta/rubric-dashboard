import { auth } from "@/lib/auth";
import { getCanonicalSubjectNames } from "@/lib/evaluations";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subjects = getCanonicalSubjectNames();
  return NextResponse.json({ subjects });
}
