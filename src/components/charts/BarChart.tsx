// 横棒グラフ。単一系列のためタイトル・凡例は呼び出し側が付ける想定。
// 外部ライブラリは使わず素のSVGで描画する（docs/PLAN.md 12章）。

type BarDatum = {
  label: string;
  value: number;
};

type BarChartProps = {
  data: BarDatum[];
  valueFormatter?: (n: number) => string;
  color?: string;
};

const DEFAULT_COLOR = "#2a78d6";

export default function BarChart({ data, valueFormatter, color }: BarChartProps) {
  if (data.length === 0) {
    return (
      <div className="w-full py-8 text-center text-sm text-[#52514e] dark:text-[#c3c2b7]">
        データがありません
      </div>
    );
  }

  const format = valueFormatter ?? ((n: number) => n.toLocaleString("ja-JP"));

  // NaNガード: 不正値は0として扱う
  const values = data.map((d) => (Number.isFinite(d.value) ? d.value : 0));
  const maxValue = Math.max(...values, 0);

  const barHeight = 20;
  const gap = 2; // 隣接する棒の間の隙間
  const rowHeight = barHeight + gap;
  const labelWidth = 132;
  const barAreaWidth = 220;
  const valueAreaWidth = 96;
  const width = labelWidth + barAreaWidth + valueAreaWidth;
  const height = data.length * rowHeight - gap;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      role="img"
      aria-label="商品別の横棒グラフ"
    >
      {data.map((d, i) => {
        const value = values[i];
        // maxValueが0(全件0件のデータ)のときの0除算ガード
        const barWidth = maxValue > 0 ? (value / maxValue) * barAreaWidth : 0;
        const y = i * rowHeight;

        return (
          <g key={`${d.label}-${i}`}>
            <text
              x={labelWidth - 8}
              y={y + barHeight / 2 + 4}
              textAnchor="end"
              fontSize={12}
              className="fill-[#0b0b0b] dark:fill-white"
            >
              {d.label}
            </text>
            <rect
              x={labelWidth}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={4}
              ry={4}
              fill={color ?? DEFAULT_COLOR}
              className={color ? undefined : "dark:fill-[#3987e5]"}
            />
            {/* 値ラベルは右端に固定(棒が最大長でもviewBox外にはみ出してクリップされないように) */}
            <text
              x={width}
              y={y + barHeight / 2 + 4}
              textAnchor="end"
              fontSize={12}
              className="fill-[#0b0b0b] dark:fill-white"
            >
              {format(value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
