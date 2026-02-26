import { auth } from "@/lib/auth";
import { listFeedback360 } from "@/lib/feedback-360";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; coachName?: string | null } | undefined;
  if (!session?.user || !user?.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "Admin" && user.role !== "Coach") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const quarter = searchParams.get("quarter") ?? undefined;
  const month = searchParams.get("month") ?? undefined;

  const options: { quarter?: string; month?: string; coachName?: string } = {};
  if (quarter) options.quarter = quarter;
  if (month) options.month = month;
  if (user.role === "Coach" && user.coachName) options.coachName = user.coachName;

  const submissions = listFeedback360(options);
  return NextResponse.json({ submissions });
}
