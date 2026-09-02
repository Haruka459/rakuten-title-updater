"use client";

import { useStore } from "@/lib/useStore";
import { eventChecksStore } from "@/lib/appStores";
import type { RakutenEvent } from "@/types/rakuten";
import Card from "@/components/ui/Card";

const MONTH_LABELS = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

type Props = {
  event: RakutenEvent;
  // 年間一覧では開催月バッジも表示する
  showMonths?: boolean;
};

export default function EventChecklist({ event, showMonths = false }: Props) {
  const checks = useStore(eventChecksStore);

  const toggle = (index: number) => {
    const key = `${event.id}:${index}`;
    eventChecksStore.update((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const total = event.checklist.length;
  const doneCount = event.checklist.filter((_, i) => checks[`${event.id}:${i}`]).length;

  return (
    <Card title={event.name} description={`${event.prepDays}日前から準備開始が目安です`}>
      {showMonths && (
        <div className="flex flex-wrap gap-1 mb-3">
          {event.months.map((m) => (
            <span
              key={m}
              className="rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-xs px-2 py-0.5"
            >
              {MONTH_LABELS[m - 1]}
            </span>
          ))}
        </div>
      )}
      <p className="text-sm text-[#52514e] dark:text-[#c3c2b7] mb-2">
        準備進捗: {total > 0 ? `${doneCount}/${total} 完了` : "チェック項目なし"}
      </p>
      <ul className="flex flex-col gap-2">
        {event.checklist.map((label, i) => {
          const key = `${event.id}:${i}`;
          const checked = !!checks[key];
          return (
            <li key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(i)}
                className="size-4 accent-blue-600"
              />
              <span className={checked ? "line-through text-black/40 dark:text-white/40" : ""}>
                {label}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
