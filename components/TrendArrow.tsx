import type { TrendDirection } from "@/lib/schema";

const styles: Record<TrendDirection, string> = {
  up: "text-green-600",
  down: "text-red-600",
  flat: "text-zinc-500",
};

export function TrendArrow({ trend }: { trend: TrendDirection }) {
  if (trend === "up") return <span className={styles.up}>↑</span>;
  if (trend === "down") return <span className={styles.down}>↓</span>;
  return <span className={styles.flat}>→</span>;
}
