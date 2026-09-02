"use client";

import type { ActionItem, ActionStatus } from "@/types/rakuten";
import Card from "@/components/ui/Card";
import { actionsStore } from "@/lib/appStores";
import { COST_BADGE_CLASS, COST_LABEL, LEVER_LABEL } from "@/components/actions/badges";

const STATUS_LABEL: Record<ActionStatus, string> = {
  todo: "未着手",
  doing: "対応中",
  done: "完了",
};

const STATUSES: ActionStatus[] = ["todo", "doing", "done"];

// 優先度スコア（PLAN.md 9章準拠: impact*2 - effort）の降順で並べる
function priorityOf(item: ActionItem): number {
  return item.impact * 2 - item.effort;
}

type Props = {
  items: ActionItem[];
  today: string | null; // "YYYY-MM-DD"。マウント前は null（期限超過の判定を行わない）
};

export default function MyActionList({ items, today }: Props) {
  const sorted = [...items].sort((a, b) => priorityOf(b) - priorityOf(a));

  const updateItem = (id: string, patch: Partial<ActionItem>) => {
    actionsStore.update((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };

  const deleteItem = (id: string) => {
    actionsStore.update((prev) => prev.filter((a) => a.id !== id));
  };

  if (sorted.length === 0) {
    return (
      <Card title="自分の施策リスト">
        <p className="text-sm text-black/40 dark:text-white/40 py-6 text-center">
          まだ施策が登録されていません。上の施策マスタから追加してください。
        </p>
      </Card>
    );
  }

  return (
    <Card title="自分の施策リスト" description="優先度スコアの高い順に表示しています。">
      <ul className="flex flex-col gap-3">
        {sorted.map((item) => {
          const overdue =
            today !== null && !!item.dueDate && item.dueDate < today && item.status !== "done";
          return (
            <li
              key={item.id}
              className="flex flex-col gap-2 rounded-md border border-black/10 dark:border-white/10 px-3 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{item.title}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10">
                  {LEVER_LABEL[item.lever]}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${COST_BADGE_CLASS[item.cost]}`}
                >
                  {COST_LABEL[item.cost]}
                </span>
                {overdue && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 font-medium">
                    期限超過
                  </span>
                )}
                <button
                  onClick={() => deleteItem(item.id)}
                  aria-label="削除"
                  className="ml-auto text-black/40 hover:text-red-600 dark:text-white/40 dark:hover:text-red-400 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-wrap gap-1">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateItem(item.id, { status: s })}
                    className={`px-3 py-1 rounded-full text-xs transition-colors ${
                      item.status === s
                        ? "bg-blue-600 text-white"
                        : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
                    }`}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <label className="flex items-center gap-1.5">
                  期限
                  <input
                    type="date"
                    value={item.dueDate ?? ""}
                    onChange={(e) => updateItem(item.id, { dueDate: e.target.value || null })}
                    className="rounded-md border border-black/10 dark:border-white/20 bg-transparent px-2 py-1"
                  />
                </label>
                <input
                  type="text"
                  value={item.note}
                  onChange={(e) => updateItem(item.id, { note: e.target.value })}
                  placeholder="メモ"
                  className="flex-1 min-w-[10rem] rounded-md border border-black/10 dark:border-white/20 bg-transparent px-2 py-1"
                />
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
