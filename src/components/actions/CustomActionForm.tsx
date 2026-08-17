"use client";

import { useState } from "react";
import type { CostTier, KpiLever } from "@/types/rakuten";
import Card from "@/components/ui/Card";
import { actionsStore } from "@/lib/appStores";
import { COST_LABEL, LEVER_LABEL } from "@/components/actions/badges";

const LEVERS: KpiLever[] = ["sessions", "cvr", "aov"];
const COSTS: CostTier[] = ["free", "ad", "paid"];

export default function CustomActionForm() {
  const [title, setTitle] = useState("");
  const [lever, setLever] = useState<KpiLever>("sessions");
  const [impact, setImpact] = useState(3);
  const [effort, setEffort] = useState(3);
  const [cost, setCost] = useState<CostTier>("free");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    actionsStore.update((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        masterId: null,
        title: trimmed,
        lever,
        impact,
        effort,
        cost,
        status: "todo",
        dueDate: null,
        note: "",
      },
    ]);
    setTitle("");
    setImpact(3);
    setEffort(3);
    setCost("free");
  };

  return (
    <Card title="自由入力で施策を追加" description="マスタに無い独自の施策を手入力で登録できます。">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="施策名を入力"
          className="rounded-md border border-black/10 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-1.5">
            指標
            <select
              value={lever}
              onChange={(e) => setLever(e.target.value as KpiLever)}
              className="rounded-md border border-black/10 dark:border-white/20 bg-transparent px-2 py-1"
            >
              {LEVERS.map((l) => (
                <option key={l} value={l}>
                  {LEVER_LABEL[l]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            コスト区分
            <select
              value={cost}
              onChange={(e) => setCost(e.target.value as CostTier)}
              className="rounded-md border border-black/10 dark:border-white/20 bg-transparent px-2 py-1"
            >
              {COSTS.map((c) => (
                <option key={c} value={c}>
                  {COST_LABEL[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            インパクト
            <input
              type="number"
              min={1}
              max={5}
              value={impact}
              onChange={(e) => setImpact(Math.min(5, Math.max(1, Number(e.target.value) || 1)))}
              className="w-16 rounded-md border border-black/10 dark:border-white/20 bg-transparent px-2 py-1"
            />
          </label>
          <label className="flex items-center gap-1.5">
            工数
            <input
              type="number"
              min={1}
              max={5}
              value={effort}
              onChange={(e) => setEffort(Math.min(5, Math.max(1, Number(e.target.value) || 1)))}
              className="w-16 rounded-md border border-black/10 dark:border-white/20 bg-transparent px-2 py-1"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={!title.trim()}
          className="self-start rounded-md bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-40"
        >
          追加
        </button>
      </form>
    </Card>
  );
}
