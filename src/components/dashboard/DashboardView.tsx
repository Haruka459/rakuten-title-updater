"use client";

// ダッシュボード画面本体。各セクションのクライアントコンポーネントを束ねる。

import { goalStore } from "@/lib/appStores";
import { useStore } from "@/lib/useStore";
import GoalForm from "@/components/dashboard/GoalForm";
import GoalOverview from "@/components/dashboard/GoalOverview";
import PatternList from "@/components/dashboard/PatternList";
import MilestoneRoadmap from "@/components/dashboard/MilestoneRoadmap";
import AlertSummary from "@/components/dashboard/AlertSummary";

export default function DashboardView() {
  const goal = useStore(goalStore);
  const goalNotSet = goal.baseline.monthlySales === 0;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[#0b0b0b] dark:text-white">ダッシュボード</h1>

      {goalNotSet && (
        <div className="rounded-xl border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/30 px-4 py-3">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            まだ現状のKPIが入力されていません。まずは下のフォームに月商・アクセス数・転換率・客単価を入力してください。
          </p>
        </div>
      )}

      <GoalForm />
      <GoalOverview />
      <PatternList />
      <MilestoneRoadmap />
      <AlertSummary />
    </div>
  );
}
