import Link from "next/link";
import { Suspense } from "react";
import { getUniqueCoachNames } from "@/lib/evaluations";
import { DashboardNav } from "./DashboardNav";
import { ViewToggle } from "./ViewToggle";

/** Dashboard depends on evaluation data from Google Sheets (runtime env); do not statically prerender. */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const coachNames = await getUniqueCoachNames();

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <aside className="w-56 border-r border-zinc-200 bg-white">
        <div className="flex h-16 items-center border-b border-zinc-200 px-4">
          <Link href="/dashboard/admin" className="font-semibold text-zinc-900">
            Dashboard
          </Link>
        </div>
        <Suspense fallback={<div className="p-2 text-sm text-zinc-400">Loading…</div>}>
          <DashboardNav coachNames={coachNames} />
        </Suspense>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6">
          <ViewToggle />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
