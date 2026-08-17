"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/useStore";
import { actionsStore } from "@/lib/appStores";
import { formatNumber, formatPercent } from "@/lib/format";
import StatTile from "@/components/ui/StatTile";
import ActionMasterList from "@/components/actions/ActionMasterList";
import CustomActionForm from "@/components/actions/CustomActionForm";
import MyActionList from "@/components/actions/MyActionList";
import type { ActionMasterItem } from "@/types/rakuten";

export default function ActionsPage() {
  const actions = useStore(actionsStore);
  // レンダー中に new Date() を直接呼ばないよう、初期化関数内で取得する
  const [today] = useState(() => new Date().toISOString().slice(0, 10));

  const addedMasterIds = useMemo(
    () => new Set(actions.map((a) => a.masterId).filter((id): id is string => id !== null)),
    [actions],
  );

  const handleAddFromMaster = (item: ActionMasterItem) => {
    actionsStore.update((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        masterId: item.id,
        title: item.title,
        lever: item.lever,
        impact: item.impact,
        effort: item.effort,
        cost: item.cost,
        status: "todo",
        dueDate: null,
        note: "",
      },
    ]);
  };

  const total = actions.length;
  const doneCount = actions.filter((a) => a.status === "done").length;
  const freeCount = actions.filter((a) => a.cost === "free").length;
  // 分母0を必ずガードする
  const completionRate = total > 0 ? doneCount / total : 0;
  const freeRate = total > 0 ? freeCount / total : 0;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
      <h1 className="text-2xl font-bold">施策プランナー</h1>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="登録施策数" value={formatNumber(total)} />
        <StatTile label="完了数" value={formatNumber(doneCount)} />
        <StatTile label="完了率" value={formatPercent(completionRate, 0)} />
        <StatTile label="無料施策の割合" value={formatPercent(freeRate, 0)} />
      </section>

      <ActionMasterList onAdd={handleAddFromMaster} addedMasterIds={addedMasterIds} />
      <CustomActionForm />
      <MyActionList items={actions} today={today} />
    </div>
  );
}
