const colors: Record<1 | 2 | 3 | 4, string> = {
  1: "bg-red-100 text-red-800",
  2: "bg-amber-100 text-amber-800",
  3: "bg-blue-100 text-blue-800",
  4: "bg-green-100 text-green-800",
};

export function ScoreBadge({ score }: { score: number | null }) {
  if (score == null) return <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">—</span>;
  const level = score as 1 | 2 | 3 | 4;
  if (level < 1 || level > 4) return <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">—</span>;
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${colors[level]}`}>
      {score}
    </span>
  );
}
