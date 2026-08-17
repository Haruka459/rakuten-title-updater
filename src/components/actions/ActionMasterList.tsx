"use client";

import { useMemo, useState } from "react";
import { actionMaster, sortByPriority } from "@/lib/actionMaster";
import type { ActionMasterItem, CostTier, KpiLever } from "@/types/rakuten";
import Card from "@/components/ui/Card";
import { COST_BADGE_CLASS, COST_LABEL, LEVER_LABEL } from "@/components/actions/badges";

const LEVER_FILTERS: { value: KpiLever | "all"; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "sessions", label: "アクセス" },
  { value: "cvr", label: "転換率" },
  { value: "aov", label: "客単価" },
];

const COST_FILTERS: CostTier[] = ["free", "ad", "paid"];

type Props = {
  onAdd: (item: ActionMasterItem) => void;
  addedMasterIds: Set<string>;
};

export default function ActionMasterList({ onAdd, addedMasterIds }: Props) {
  const [leverFilter, setLeverFilter] = useState<KpiLever | "all">("all");
  // 追加費用をかけない方針のため、既定は「無料でできる」のみONにしておく
  const [costFilter, setCostFilter] = useState<Set<CostTier>>(() => new Set(["free"]));

  const items = useMemo(() => {
    return sortByPriority(actionMaster).filter((item) => {
      if (leverFilter !== "all" && item.lever !== leverFilter) return false;
      if (!costFilter.has(item.cost)) return false;
      return true;
    });
  }, [leverFilter, costFilter]);

  const toggleCost = (cost: CostTier) => {
    setCostFilter((prev) => {
      const next = new Set(prev);
      if (next.has(cost)) {
        next.delete(cost);
      } else {
        next.add(cost);
      }
      return next;
    });
  };

  return (
    <Card
      title="施策マスタから選ぶ"
      description="優先度スコア（インパクト×2−工数）の高い順に表示しています。"
    >
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-wrap gap-1">
          {LEVER_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setLeverFilter(f.value)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                leverFilter === f.value
                  ? "bg-blue-600 text-white"
                  : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {COST_FILTERS.map((cost) => (
            <label
              key={cost}
              className="flex items-center gap-1.5 text-sm px-2 py-1 rounded-md border border-black/10 dark:border-white/10 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={costFilter.has(cost)}
                onChange={() => toggleCost(cost)}
                className="size-4 accent-blue-600"
              />
              {COST_LABEL[cost]}
            </label>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-black/40 dark:text-white/40 py-6 text-center">
          条件に合う施策がありません。フィルタを調整してください。
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            const added = addedMasterIds.has(item.id);
            return (
              <li
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-md border border-black/10 dark:border-white/10 px-3 py-2.5"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10">
                      {LEVER_LABEL[item.lever]}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${COST_BADGE_CLASS[item.cost]}`}
                    >
                      {COST_LABEL[item.cost]}
                    </span>
                  </div>
                  <p className="text-sm text-[#52514e] dark:text-[#c3c2b7]">{item.description}</p>
                  <p className="text-xs text-black/40 dark:text-white/40 mt-0.5">
                    インパクト {item.impact} / 工数 {item.effort}
                  </p>
                </div>
                <button
                  onClick={() => onAdd(item)}
                  disabled={added}
                  className="shrink-0 rounded-md bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:hover:bg-blue-600"
                >
                  {added ? "追加済み" : "追加"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
