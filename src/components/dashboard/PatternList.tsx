"use client";

// 逆算パターン一覧。requiredPatterns() の4件をカード表示する（docs/PLAN.md 2章-4）。

import { goalStore } from "@/lib/appStores";
import { useStore } from "@/lib/useStore";
import { requiredPatterns } from "@/lib/kpi";
import { formatMultiplier, formatNumber, formatPercent, formatYen } from "@/lib/format";
import Card from "@/components/ui/Card";

export default function PatternList() {
  const goal = useStore(goalStore);
  const patterns = requiredPatterns(goal);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {patterns.map((p) => (
        // feasible=false のパターンは色だけでなく文言でも警告し、視覚的にも沈める
        <div key={p.id} className={p.feasible ? "" : "opacity-60"}>
          <Card title={p.label} description={p.description}>
            <ul className="text-sm space-y-1 text-[#0b0b0b] dark:text-white">
              <li>
                必要アクセス数: {formatNumber(p.required.sessions)}（{formatMultiplier(p.multipliers.sessions)}）
              </li>
              <li>
                必要転換率: {formatPercent(p.required.cvr)}（{formatMultiplier(p.multipliers.cvr)}）
              </li>
              <li>
                必要客単価: {formatYen(p.required.aov)}（{formatMultiplier(p.multipliers.aov)}）
              </li>
            </ul>
            {!p.feasible && (
              <p className="mt-3 text-sm font-medium text-[#d03b3b] bg-[#d03b3b]/10 border border-[#d03b3b]/30 rounded-md px-3 py-2">
                転換率が100%を超えるため実現不可能です
              </p>
            )}
          </Card>
        </div>
      ))}
    </div>
  );
}
