import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as { id?: string; name?: string | null; email?: string | null; role?: string };
  const role = user.role ?? "Coach";

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <aside className="w-56 border-r border-zinc-200 bg-white">
        <div className="flex h-16 items-center border-b border-zinc-200 px-4">
          <Link href={role === "Admin" ? "/dashboard/admin" : "/dashboard/coach"} className="font-semibold text-zinc-900">
            Dashboard
          </Link>
        </div>
        <nav className="p-2">
          {role === "Admin" && (
            <>
              <NavLink href="/dashboard/admin">Org Overview</NavLink>
              <NavLink href="/dashboard/admin/risk">Risk Dashboard</NavLink>
              <NavLink href="/dashboard/admin/coaches">Coach Effectiveness</NavLink>
              <NavLink href="/dashboard/admin/coach-trends">Coach trends</NavLink>
              <NavLink href="/dashboard/admin/trends">Trends</NavLink>
              <NavLink href="/dashboard/admin/users">User Management</NavLink>
            </>
          )}
          {role === "Coach" && (
            <>
              <NavLink href="/dashboard/coach">My Developers</NavLink>
              <NavLink href="/dashboard/coach#portfolio-health">Portfolio Health</NavLink>
            </>
          )}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6">
          <span className="text-sm text-zinc-600">{user.name ?? user.email ?? "User"}</span>
          <div className="flex items-center gap-3">
            <span className="rounded bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700">
              {role}
            </span>
            <form action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}>
              <button type="submit" className="text-sm text-zinc-600 hover:text-zinc-900">
                Logout
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block rounded px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
    >
      {children}
    </Link>
  );
}
