"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function DashboardNav({ coachNames }: { coachNames: string[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAdmin = pathname.startsWith("/dashboard/admin");
  const isCoach = pathname.startsWith("/dashboard/coach");
  const coachParam = isCoach ? searchParams.get("coach") : null;
  const currentCoach = coachParam ?? coachNames[0] ?? "";
  const coachQuery = currentCoach ? `?coach=${encodeURIComponent(currentCoach)}` : "";

  return (
    <nav className="p-2">
      {isAdmin && (
        <>
          <NavLink href="/dashboard/admin">Org Overview</NavLink>
          <NavLink href="/dashboard/admin/risk">Risk Dashboard</NavLink>
          <NavLink href="/dashboard/admin/coaches">Coach Effectiveness</NavLink>
          <NavLink href="/dashboard/admin/coach-trends">Coach trends</NavLink>
          <NavLink href="/dashboard/admin/trends">Trends</NavLink>
          <NavLink href="/dashboard/admin/users">User Management</NavLink>
        </>
      )}
      {isCoach && (
        <>
          <NavLink href={`/dashboard/coach${coachQuery}`}>My Developers</NavLink>
          <NavLink href={`/dashboard/coach${coachQuery}#portfolio-health`}>Portfolio Health</NavLink>
          {coachNames.length > 1 && (
            <div className="mt-3 border-t border-zinc-200 pt-2">
              <p className="px-3 py-1 text-xs font-medium text-zinc-500">Viewing as coach</p>
              <CoachSelector coachNames={coachNames} currentCoach={currentCoach} />
            </div>
          )}
        </>
      )}
    </nav>
  );
}

function CoachSelector({ coachNames, currentCoach }: { coachNames: string[]; currentCoach: string }) {
  return (
    <select
      className="mx-2 mt-1 w-[calc(100%-1rem)] rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-800"
      value={currentCoach}
      onChange={(e) => {
        const name = e.target.value;
        if (name) {
          const url = new URL(window.location.href);
          url.searchParams.set("coach", name);
          window.location.href = url.pathname + url.search;
        }
      }}
    >
      {coachNames.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
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
