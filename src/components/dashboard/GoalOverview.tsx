"use client";

// 目標サマリー(StatTile)と達成率ゲージ（docs/PLAN.md 2章-2,3）。

import { goalStore } from "@/lib/appStores";
import { useStore } from "@/lib/useStore";
import { gapToTarget, salesOf, targetSales } from "@/lib/kpi";
import { formatYen } from "@/lib/format";
import StatTile from "@/components/ui/StatTile";
import Gauge from "@/components/charts/Gauge";

export default function GoalOverview() {
  const goal = useStore(goalStore);
  const currentSales = salesOf(goal.baseline);
  const target = targetSales(goal);
  const gap = gapToTarget(goal, currentSales);
  // 分母0のときはNaNを渡さず0にする
  const achievementRate = target > 0 ? (currentSales / target) * 100 : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile label="現状月商" value={formatYen(currentSales)} />
        <StatTile label="目標月商" value={formatYen(target)} />
        <StatTile
          label="目標までの不足額"
          value={gap > 0 ? formatYen(gap) : formatYen(0)}
          tone={gap > 0 ? "bad" : "good"}
          delta={gap > 0 ? undefined : "目標を達成しています"}
        />
      </div>
      <div className="flex justify-center">
        <Gauge
          value={achievementRate}
          label="目標達成率"
          sublabel={`${formatYen(currentSales)} / ${formatYen(target)}`}
        />
      </div>
    </div>
  );
}
