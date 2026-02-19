import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDeveloperQuarterSnapshots, getQuartersSorted } from "@/lib/evaluations";
import { getDeveloperTimeline } from "@/lib/risk";
import { computeDeveloperRisk } from "@/lib/risk";
import { RiskBadges } from "@/components/RiskBadges";
import { ScoreBadge } from "@/components/ScoreBadge";
import { DIMENSION_LABELS } from "@/lib/schema";
import { DeveloperDetailClient } from "./DeveloperDetailClient";

export default async function CoachDeveloperDetailPage({
  params,
}: {
  params: Promise<{ developer: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as { role?: string; coachName?: string | null };
  if (user.role !== "Coach" || !user.coachName) redirect("/login");

  const developerName = decodeURIComponent((await params).developer);
  const coachName = user.coachName;
  const snapshots = getDeveloperQuarterSnapshots({ coachName });
  const coachSnapshots = snapshots.filter((s) => s.consultantName === developerName);
  if (coachSnapshots.length === 0) redirect("/dashboard/coach");

  const timeline = getDeveloperTimeline(snapshots, coachName, developerName);
  const quarters = getQuartersSorted();
  const history = Array.from(timeline.keys())
    .sort()
    .map((k) => timeline.get(k)!);
  const flags = computeDeveloperRisk(snapshots, coachName, developerName);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/coach" className="text-sm text-blue-600 hover:underline">
          ← My Developers
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900">{developerName}</h1>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700">Risk flags</p>
        <RiskBadges flags={flags} />
      </div>
      <DeveloperDetailClient history={history} />
    </div>
  );
}
