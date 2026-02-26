import { getCanonicalSubjectNames } from "@/lib/evaluations";
import { FeedbackFormClient } from "./FeedbackFormClient";

export default async function FeedbackPage() {
  const subjects = getCanonicalSubjectNames();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">360° Feedback</h1>
      <p className="text-sm text-zinc-600">
        Submit feedback about a colleague. Select the person, your role, and rate them on each dimension (1–4).
        One submission per person per quarter; resubmitting replaces your previous feedback.
      </p>
      <FeedbackFormClient subjects={subjects} />
    </div>
  );
}
