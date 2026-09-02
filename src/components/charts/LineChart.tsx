// 2系列の折れ線グラフ。単一y軸のみで、2軸グラフは作らない。
// 外部ライブラリは使わず素のSVGで描画する（docs/PLAN.md 12章）。

type LinePoint = {
  x: string;
  y: number;
};

type LineSeries = {
  name: string;
  color?: string;
  points: LinePoint[];
};

type LineChartProps = {
  series: LineSeries[];
  valueFormatter?: (n: number) => string;
};

const GRID_COLOR = "#e1e0d9";
const AXIS_LABEL_COLOR = "#898781";

// 固定順のカテゴリカル配色(docs/PLAN.md 12章)。系列3・4は将来の拡張用フォールバック。
const DEFAULT_SERIES_COLOR_CLASS = [
  "fill-[#2a78d6] dark:fill-[#3987e5]",
  "fill-[#eb6834] dark:fill-[#d95926]",
  "fill-[#1baf7a] dark:fill-[#199e70]",
  "fill-[#eda100] dark:fill-[#c98500]",
];
const DEFAULT_SERIES_STROKE_CLASS = [
  "stroke-[#2a78d6] dark:stroke-[#3987e5]",
  "stroke-[#eb6834] dark:stroke-[#d95926]",
  "stroke-[#1baf7a] dark:stroke-[#199e70]",
  "stroke-[#eda100] dark:stroke-[#c98500]",
];

// y軸目盛は桁を圧縮して表示する(例: 12,345,678 -> "1235万", 45,000 -> "4.5万")
// 系列の最終点の直接ラベルには使わず、format()(呼び出し側指定の書式)をそのまま使う
function formatAxisTick(n: number): string {
  const v = Number.isFinite(n) ? n : 0;
  const abs = Math.abs(v);
  if (abs >= 1e8) return `${(v / 1e8).toFixed(1)}億`;
  if (abs >= 1e4) {
    const man = v / 1e4;
    return abs >= 1e7 ? `${Math.round(man)}万` : `${man.toFixed(1)}万`;
  }
  return Math.round(v).toLocaleString("ja-JP");
}

export default function LineChart({ series, valueFormatter }: LineChartProps) {
  const format = valueFormatter ?? ((n: number) => n.toLocaleString("ja-JP"));

  // x軸カテゴリ: 全系列のxラベルを出現順に統合する
  const categories: string[] = [];
  series.forEach((s) => {
    s.points.forEach((p) => {
      if (!categories.includes(p.x)) categories.push(p.x);
    });
  });

  const hasData = categories.length > 0 && series.some((s) => s.points.length > 0);

  if (!hasData) {
    return (
      <div className="w-full py-8 text-center text-sm text-[#52514e] dark:text-[#c3c2b7]">
        データがありません
      </div>
    );
  }

  const allValues = series.flatMap((s) =>
    s.points.map((p) => (Number.isFinite(p.y) ? p.y : 0)),
  );
  const rawMax = allValues.length > 0 ? Math.max(...allValues, 0) : 0;
  const rawMin = allValues.length > 0 ? Math.min(...allValues, 0) : 0;
  // 値が全て同一(差が0)のときの0除算ガード
  const yMax = rawMax === rawMin ? rawMax + Math.max(Math.abs(rawMax), 1) : rawMax;
  const yMin = rawMax === rawMin ? Math.min(rawMin, 0) : rawMin;
  const yRange = yMax - yMin || 1;

  const width = 560;
  const height = 260;
  const padLeft = 64;
  const padRight = 20;
  const padTop = 16;
  const padBottom = 32;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const xPos = (label: string) => {
    // カテゴリが1件のみのときの0除算ガード
    if (categories.length <= 1) return padLeft + plotWidth / 2;
    const idx = categories.indexOf(label);
    return padLeft + (idx / (categories.length - 1)) * plotWidth;
  };

  const yPos = (value: number) => {
    const v = Number.isFinite(value) ? value : 0;
    return padTop + plotHeight - ((v - yMin) / yRange) * plotHeight;
  };

  const gridTicks = 4;
  const gridLines = Array.from({ length: gridTicks + 1 }, (_, i) => {
    const ratio = i / gridTicks;
    return {
      y: padTop + plotHeight - ratio * plotHeight,
      value: yMin + yRange * ratio,
    };
  });

  return (
    <div className="w-full">
      {/* 凡例: 系列が1本のときはタイトルが系列名を兼ねるため不要。2以上のときのみ色だけで識別させない */}
      {series.length >= 2 && (
        <div className="flex flex-wrap gap-4 mb-2">
          {series.map((s, i) => (
            <div key={s.name} className="flex items-center gap-1.5 text-sm">
              <span
                aria-hidden="true"
                className={`inline-block size-2.5 rounded-full ${
                  s.color ? "" : DEFAULT_SERIES_COLOR_CLASS[i % DEFAULT_SERIES_COLOR_CLASS.length]
                }`}
                style={s.color ? { backgroundColor: s.color } : undefined}
              />
              <span className="text-[#0b0b0b] dark:text-white">{s.name}</span>
            </div>
          ))}
        </div>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        role="img"
        aria-label="折れ線グラフ"
      >
        {/* 控えめなグリッド線 */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line
              x1={padLeft}
              x2={width - padRight}
              y1={g.y}
              y2={g.y}
              stroke={GRID_COLOR}
              strokeWidth={1}
              className="dark:stroke-[#2c2c2a]"
            />
            <text
              x={padLeft - 8}
              y={g.y + 4}
              textAnchor="end"
              fontSize={11}
              fill={AXIS_LABEL_COLOR}
            >
              {formatAxisTick(g.value)}
            </text>
          </g>
        ))}

        {/* x軸ラベル */}
        {categories.map((c) => (
          <text
            key={c}
            x={xPos(c)}
            y={height - padBottom + 18}
            textAnchor="middle"
            fontSize={11}
            fill={AXIS_LABEL_COLOR}
          >
            {c}
          </text>
        ))}

        {series.map((s, si) => {
          if (s.points.length === 0) return null;
          const linePoints = s.points
            .map((p) => `${xPos(p.x)},${yPos(p.y)}`)
            .join(" ");
          const last = s.points[s.points.length - 1];
          const strokeClass = s.color
            ? undefined
            : DEFAULT_SERIES_STROKE_CLASS[si % DEFAULT_SERIES_STROKE_CLASS.length];
          const fillClass = s.color
            ? undefined
            : DEFAULT_SERIES_COLOR_CLASS[si % DEFAULT_SERIES_COLOR_CLASS.length];

          return (
            <g key={s.name}>
              <polyline
                points={linePoints}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                className={strokeClass}
              />
              {s.points.map((p, pi) => (
                <circle
                  key={pi}
                  cx={xPos(p.x)}
                  cy={yPos(p.y)}
                  r={4}
                  fill={s.color}
                  className={fillClass}
                />
              ))}
              {/* 最終点にのみ直接ラベルを付ける(全点には付けない) */}
              <text
                x={xPos(last.x)}
                y={yPos(last.y) + (si % 2 === 0 ? -10 : 20)}
                textAnchor="middle"
                fontSize={11}
                fontWeight={600}
                className="fill-[#0b0b0b] dark:fill-white"
              >
                {format(last.y)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
