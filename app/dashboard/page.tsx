import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = (session.user as { role?: string })?.role;
  if (role === "Admin") redirect("/dashboard/admin");
  redirect("/dashboard/coach");
}
