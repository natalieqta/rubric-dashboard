import type { DeveloperRiskFlags } from "@/lib/schema";
import { DIMENSION_LABELS, type DimensionKey } from "@/lib/schema";

function Badge({
  label,
  dims,
  color,
}: {
  label: string;
  dims: DimensionKey[];
  color: string;
}) {
  if (!dims.length) return null;
  const sub = dims.map((d) => DIMENSION_LABELS[d]).join(", ");
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-medium ${color}`}
      title={sub}
    >
      {label}
      {dims.length > 0 && ` (${dims.map((d) => DIMENSION_LABELS[d]).join(", ")})`}
    </span>
  );
}

export function RiskBadges({ flags }: { flags: DeveloperRiskFlags }) {
  return (
    <div className="flex flex-wrap gap-1">
      {flags.lowScore?.length ? (
        <Badge label="Low Score" dims={flags.lowScore} color="bg-red-100 text-red-800" />
      ) : null}
      {flags.declining?.length ? (
        <Badge label="Declining" dims={flags.declining} color="bg-orange-100 text-orange-800" />
      ) : null}
      {flags.stagnant?.length ? (
        <Badge label="Stagnant" dims={flags.stagnant} color="bg-yellow-100 text-yellow-800" />
      ) : null}
      {flags.dataGap?.length ? (
        <Badge label="Data Gap" dims={flags.dataGap} color="bg-zinc-200 text-zinc-700" />
      ) : null}
      {!flags.lowScore?.length && !flags.declining?.length && !flags.stagnant?.length && !flags.dataGap?.length && (
        <span className="text-xs text-zinc-500">—</span>
      )}
    </div>
  );
}
