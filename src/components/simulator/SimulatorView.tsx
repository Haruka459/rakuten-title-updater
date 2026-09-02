"use client";

// KPIシミュレーター画面本体（docs/PLAN.md 2章 シミュレーター）。
// goalStore の baseline を土台に、3指標の改善倍率スライダーをライブ計算する。

import { useMemo, useState } from "react";
import Link from "next/link";
import { goalStore } from "@/lib/appStores";
import { useStore } from "@/lib/useStore";
import { requiredPatterns, salesOf, simulate } from "@/lib/kpi";
import { formatMultiplier, formatYen } from "@/lib/format";
import type { KpiLever, LeverMultipliers } from "@/types/rakuten";
import Card from "@/components/ui/Card";
import Gauge from "@/components/charts/Gauge";

const SLIDER_MIN = 1;
const SLIDER_MAX = 3;
const SLIDER_STEP = 0.05;

const LEVER_ORDER: KpiLever[] = ["sessions", "cvr", "aov"];
const LEVER_LABEL: Record<KpiLever, string> = {
  sessions: "アクセス数",
  cvr: "転換率",
  aov: "客単価",
};

export default function SimulatorView() {
  const goal = useStore(goalStore);
  const [multipliers, setMultipliers] = useState<LeverMultipliers>({
    sessions: 1,
    cvr: 1,
    aov: 1,
  });

  const baselineSales = salesOf(goal.baseline);
  const hasBaseline = baselineSales > 0;

  const result = useMemo(
    () => simulate(goal.baseline, multipliers, goal.targetMultiplier),
    [goal.baseline, multipliers, goal.targetMultiplier],
  );

  const patterns = useMemo(() => requiredPatterns(goal), [goal]);

  // 分母0のときはNaNを渡さず0にする
  const gaugeValue =
    goal.targetMultiplier > 0 ? (result.achievedMultiplier / goal.targetMultiplier) * 100 : 0;

  const handleSliderChange = (lever: KpiLever, value: number) => {
    setMultipliers((prev) => ({ ...prev, [lever]: value }));
  };

  if (!hasBaseline) {
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-[#0b0b0b] dark:text-white">KPIシミュレーター</h1>
        <div className="rounded-xl border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/30 px-4 py-4">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
            現状のKPIが未入力のため、シミュレーションできません。
          </p>
          <Link href="/" className="text-sm underline text-blue-700 dark:text-blue-300">
            まずダッシュボードで現状を入力してください
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[#0b0b0b] dark:text-white">KPIシミュレーター</h1>

      <Card
        title="改善倍率スライダー"
        description="3指標をどれだけ改善するかを調整すると、予測売上がライブに更新されます"
      >
        <div className="flex flex-col gap-5">
          {LEVER_ORDER.map((lever) => (
            <div key={lever}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-[#0b0b0b] dark:text-white">{LEVER_LABEL[lever]}</span>
                <span className="text-[#52514e] dark:text-[#c3c2b7]">
                  {formatMultiplier(multipliers[lever])}
                </span>
              </div>
              <input
                type="range"
                min={SLIDER_MIN}
                max={SLIDER_MAX}
                step={SLIDER_STEP}
                value={multipliers[lever]}
                onChange={(e) => handleSliderChange(lever, Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
          ))}
        </div>
      </Card>

      <Card title="達成パターン提案" description="ボタンを押すと、そのパターンの倍率にスライダーが切り替わります">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {patterns.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setMultipliers(p.multipliers)}
              className={`text-left rounded-lg border px-3 py-2 transition-colors border-black/10 dark:border-white/10 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 ${
                p.feasible ? "" : "opacity-60"
              }`}
            >
              <p className="text-sm font-semibold text-[#0b0b0b] dark:text-white">{p.label}</p>
              <p className="text-xs text-[#52514e] dark:text-[#c3c2b7] mt-0.5">
                アクセス{formatMultiplier(p.multipliers.sessions)} / 転換率{formatMultiplier(p.multipliers.cvr)} /
                客単価{formatMultiplier(p.multipliers.aov)}
              </p>
              {!p.feasible && (
                <p className="text-xs font-medium text-[#d03b3b] mt-1">
                  転換率が100%を超えるため実現不可能
                </p>
              )}
            </button>
          ))}
        </div>
      </Card>

      <Card title="予測結果">
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <Gauge
            value={gaugeValue}
            label="達成倍率"
            sublabel={`${formatMultiplier(result.achievedMultiplier)} / 目標${formatMultiplier(goal.targetMultiplier)}`}
          />
          <div className="flex-1 flex flex-col gap-2">
            <p className="text-sm text-[#0b0b0b] dark:text-white">
              予測売上: <span className="font-semibold text-lg">{formatYen(result.projectedSales)}</span>
            </p>
            <p className="text-sm text-[#0b0b0b] dark:text-white">
              達成倍率: <span className="font-semibold">{formatMultiplier(result.achievedMultiplier)}</span>
            </p>
            <p
              className={`text-sm font-semibold ${
                result.reachesGoal ? "text-[#0ca30c]" : "text-[#d03b3b]"
              }`}
            >
              {result.reachesGoal ? "目標に到達しています" : "目標に未到達です"}
            </p>
          </div>
        </div>
      </Card>

      <Card title="結論">
        <p className="text-sm leading-relaxed text-[#0b0b0b] dark:text-white">
          アクセス数を{formatMultiplier(multipliers.sessions)}、転換率を{formatMultiplier(multipliers.cvr)}
          、客単価を{formatMultiplier(multipliers.aov)}にすると、売上は{formatMultiplier(result.achievedMultiplier)}
          になります（目標{formatMultiplier(goal.targetMultiplier)}に対して
          {result.reachesGoal ? "到達" : "未到達"}）。
        </p>
      </Card>
    </div>
  );
}
