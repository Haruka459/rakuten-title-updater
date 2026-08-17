// 大きな数値を見せるタイル。delta(増減)は色だけでなく矢印記号も併記する。

type StatTileProps = {
  label: string;
  value: string;
  delta?: string;
  tone?: "good" | "bad" | "neutral";
};

const TONE_TEXT_CLASS: Record<NonNullable<StatTileProps["tone"]>, string> = {
  good: "text-[#0ca30c]",
  bad: "text-[#d03b3b]",
  neutral: "text-[#52514e] dark:text-[#c3c2b7]",
};

export default function StatTile({ label, value, delta, tone = "neutral" }: StatTileProps) {
  const trimmedDelta = delta?.trim() ?? "";
  // 先頭の符号から矢印方向を判定する(色だけに頼らない)
  const isNegative = trimmedDelta.startsWith("-") || trimmedDelta.startsWith("−");
  const arrow = isNegative ? "↓" : "↑";

  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-4">
      <p className="text-xs text-[#52514e] dark:text-[#c3c2b7]">{label}</p>
      <p className="text-2xl font-bold mt-1 text-[#0b0b0b] dark:text-white">{value}</p>
      {delta && (
        <p className={`text-sm mt-1 font-medium ${TONE_TEXT_CLASS[tone]}`}>
          <span aria-hidden="true">{arrow}</span> {delta}
        </p>
      )}
    </div>
  );
}
