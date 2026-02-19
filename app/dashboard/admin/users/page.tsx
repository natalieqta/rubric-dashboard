import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUniqueCoachNames } from "@/lib/evaluations";
import { UsersClient } from "./UsersClient";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "Admin") redirect("/login");

  const coachNames = getUniqueCoachNames();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">User Management</h1>
      <UsersClient coachNames={coachNames} />
    </div>
  );
}
