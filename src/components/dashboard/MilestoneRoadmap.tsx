"use client";

// 月次ロードマップ。monthlyMilestones() を LineChart(系列名「目標売上」)に流す
// （docs/PLAN.md 2章-5）。

import { goalStore } from "@/lib/appStores";
import { useStore } from "@/lib/useStore";
import { monthlyMilestones } from "@/lib/kpi";
import { formatMultiplier, formatNumber, formatYen } from "@/lib/format";
import Card from "@/components/ui/Card";
import LineChart from "@/components/charts/LineChart";

export default function MilestoneRoadmap() {
  const goal = useStore(goalStore);
  const milestones = monthlyMilestones(goal);

  return (
    <Card
      title="月次ロードマップ"
      description={`${formatNumber(goal.months)}ヶ月で目標倍率${formatMultiplier(goal.targetMultiplier)}を達成するための複利成長シナリオ`}
    >
      <LineChart
        series={[
          {
            name: "目標売上",
            points: milestones.map((m) => ({ x: m.label, y: m.targetSales })),
          },
        ]}
        valueFormatter={formatYen}
      />
    </Card>
  );
}
