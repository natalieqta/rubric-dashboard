"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ViewToggle() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/dashboard/admin");
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-zinc-600">View:</span>
      <Link
        href="/dashboard/admin"
        className={`rounded px-3 py-1.5 text-sm font-medium ${
          isAdmin ? "bg-zinc-900 text-white" : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300"
        }`}
      >
        Admin
      </Link>
      <Link
        href="/dashboard/coach"
        className={`rounded px-3 py-1.5 text-sm font-medium ${
          !isAdmin ? "bg-zinc-900 text-white" : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300"
        }`}
      >
        Coach
      </Link>
    </div>
  );
}
