import { getQuartersSorted } from "@/lib/evaluations";
import { FeedbackSubmissionsClient } from "./FeedbackSubmissionsClient";

function getMonthOptions(): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

export default async function AdminFeedbackPage() {
  const quarterOptions = getQuartersSorted();
  const monthOptions = getMonthOptions();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">360 Submissions</h1>
      <FeedbackSubmissionsClient
        quarterOptions={quarterOptions}
        monthOptions={monthOptions}
      />
    </div>
  );
}
