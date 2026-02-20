import { getUniqueCoachNames } from "@/lib/evaluations";
import { UsersClient } from "./UsersClient";

export default async function AdminUsersPage() {
  const coachNames = getUniqueCoachNames();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">User Management</h1>
      <UsersClient coachNames={coachNames} />
    </div>
  );
}
