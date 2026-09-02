// 半円ゲージ。目標達成率などの0-100%(超過あり)を表示する。
// 外部ライブラリは使わず素のSVGで描画する（docs/PLAN.md 12章）。

type GaugeProps = {
  value: number; // 達成率(%)。100を超えてもよい
  max?: number; // 表示上のスケール上限。既定100
  label: string;
  sublabel?: string;
};

const GOOD_COLOR = "#0ca30c";
const WARNING_COLOR = "#fab219";
const CRITICAL_COLOR = "#d03b3b";

const TRACK_COLOR = "#e1e0d9";

function toneOf(value: number): { color: string; text: string } {
  if (value >= 100) return { color: GOOD_COLOR, text: "達成" };
  if (value >= 70) return { color: WARNING_COLOR, text: "順調" };
  return { color: CRITICAL_COLOR, text: "要対策" };
}

// fraction(0-1) の位置を半円(左端=0, 上頂点=0.5, 右端=1)の座標に変換する
function pointOnArc(cx: number, cy: number, r: number, fraction: number) {
  const angle = Math.PI - fraction * Math.PI; // 180deg -> 0deg
  return {
    x: cx + r * Math.cos(angle),
    y: cy - r * Math.sin(angle),
  };
}

function arcPath(cx: number, cy: number, r: number, fromFraction: number, toFraction: number) {
  const start = pointOnArc(cx, cy, r, fromFraction);
  const end = pointOnArc(cx, cy, r, toFraction);
  // このゲージは半円(最大180度)しか描かないため、中心角が180度を超えることはなく
  // SVGのlarge-arc-flagは常に0でなければならない(0だと補角側の大きい弧が描かれ破綻する)
  return `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`;
}

export default function Gauge({ value, max = 100, label, sublabel }: GaugeProps) {
  // NaN・0除算ガード
  const safeValue = Number.isFinite(value) ? value : 0;
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  // バーは100%(=safeMax)で頭打ちにするが、数値ラベルには実値を出す
  const fraction = Math.min(Math.max(safeValue / safeMax, 0), 1);
  const { color, text } = toneOf(safeValue);

  const cx = 100;
  const cy = 100;
  const r = 76;
  const strokeWidth = 16;

  return (
    <div className="w-full max-w-xs">
      <svg
        viewBox="0 0 200 118"
        className="w-full h-auto"
        role="img"
        aria-label={`${label} 達成率 ${safeValue.toFixed(1)}%`}
      >
        {/* 背景トラック */}
        <path
          d={arcPath(cx, cy, r, 0, 1)}
          fill="none"
          stroke={TRACK_COLOR}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="dark:stroke-[#2c2c2a]"
        />
        {/* 達成率バー(fractionが0のときは描画しない) */}
        {fraction > 0 && (
          <path
            d={arcPath(cx, cy, r, 0, fraction)}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}
        {/* 色だけで伝えず、数値ラベルを必ず併記する */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fontSize={28}
          fontWeight={700}
          className="fill-[#0b0b0b] dark:fill-white"
        >
          {safeValue.toFixed(0)}%
        </text>
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          fontSize={12}
          className="fill-[#52514e] dark:fill-[#c3c2b7]"
        >
          {text}
        </text>
      </svg>
      <div className="text-center mt-1">
        <p className="text-sm font-medium text-[#0b0b0b] dark:text-white">{label}</p>
        {sublabel && (
          <p className="text-xs text-[#52514e] dark:text-[#c3c2b7]">{sublabel}</p>
        )}
      </div>
    </div>
  );
}
