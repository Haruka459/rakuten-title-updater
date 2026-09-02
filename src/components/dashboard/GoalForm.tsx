"use client";

// 現状KPI入力フォーム。goalStore に保存する（docs/PLAN.md 2章-1）。
// 転換率はUI上は%（例 2.34）で入力させ、保存時に /100 して小数で保持する。

import { useEffect, useState } from "react";
import { goalStore } from "@/lib/appStores";
import { useStore } from "@/lib/useStore";
import { salesOf } from "@/lib/kpi";
import { formatYen, parseNumericInput } from "@/lib/format";
import type { GoalSetting } from "@/types/rakuten";

type FormState = {
  monthlySales: string;
  sessions: string;
  cvrPercent: string;
  aov: string;
  targetMultiplier: string;
  months: string;
};

// 表示用: 小数を丸め誤差なく文字列化する（0は空欄扱い）
function numToInput(n: number, digits = 4): string {
  if (!Number.isFinite(n) || n === 0) return "";
  return String(Number(n.toFixed(digits)));
}

function goalToForm(goal: GoalSetting): FormState {
  return {
    monthlySales: numToInput(goal.baseline.monthlySales, 0),
    sessions: numToInput(goal.baseline.sessions, 0),
    cvrPercent: numToInput(goal.baseline.cvr * 100),
    aov: numToInput(goal.baseline.aov, 0),
    targetMultiplier: numToInput(goal.targetMultiplier) || "2",
    months: numToInput(goal.months, 0) || "12",
  };
}

export default function GoalForm() {
  const goal = useStore(goalStore);
  const [form, setForm] = useState<FormState>(() => goalToForm(goal));
  // localStorageからの初回ハイドレーション後の値だけをフォームに反映し、
  // 以降はユーザーの入力を上書きしない
  const [syncedOnce, setSyncedOnce] = useState(false);
  useEffect(() => {
    if (!syncedOnce) {
      setForm(goalToForm(goal));
      setSyncedOnce(true);
    }
  }, [goal, syncedOnce]);

  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ライブでの食い違いチェック用（保存前の入力値ベース）
  const parsedMonthlySales = parseNumericInput(form.monthlySales);
  const parsedSessions = parseNumericInput(form.sessions);
  const parsedCvr = parseNumericInput(form.cvrPercent) / 100;
  const parsedAov = parseNumericInput(form.aov);
  const calculatedSales = salesOf({ monthlySales: 0, sessions: parsedSessions, cvr: parsedCvr, aov: parsedAov });
  const showMismatch =
    parsedMonthlySales > 0 &&
    calculatedSales > 0 &&
    Math.abs(calculatedSales - parsedMonthlySales) / parsedMonthlySales > 0.05;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMultiplier = parseNumericInput(form.targetMultiplier) || 2;
    const months = Math.max(1, Math.round(parseNumericInput(form.months)) || 12);

    goalStore.set({
      baseline: {
        monthlySales: parsedMonthlySales,
        sessions: parsedSessions,
        cvr: parsedCvr,
        aov: parsedAov,
      },
      targetMultiplier,
      months,
      updatedAt: Date.now(),
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 p-4 sm:p-5"
    >
      <h2 className="text-base font-semibold text-[#0b0b0b] dark:text-white mb-3">現状KPI入力</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[#52514e] dark:text-[#c3c2b7]">月商(円)</span>
          <input
            type="text"
            inputMode="decimal"
            value={form.monthlySales}
            onChange={(e) => updateField("monthlySales", e.target.value)}
            placeholder="例: 3000000"
            className="rounded-md border border-black/10 dark:border-white/20 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[#52514e] dark:text-[#c3c2b7]">月間アクセス数</span>
          <input
            type="text"
            inputMode="decimal"
            value={form.sessions}
            onChange={(e) => updateField("sessions", e.target.value)}
            placeholder="例: 50000"
            className="rounded-md border border-black/10 dark:border-white/20 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[#52514e] dark:text-[#c3c2b7]">転換率(%)</span>
          <input
            type="text"
            inputMode="decimal"
            value={form.cvrPercent}
            onChange={(e) => updateField("cvrPercent", e.target.value)}
            placeholder="例: 2.34"
            className="rounded-md border border-black/10 dark:border-white/20 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[#52514e] dark:text-[#c3c2b7]">客単価(円)</span>
          <input
            type="text"
            inputMode="decimal"
            value={form.aov}
            onChange={(e) => updateField("aov", e.target.value)}
            placeholder="例: 4500"
            className="rounded-md border border-black/10 dark:border-white/20 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[#52514e] dark:text-[#c3c2b7]">目標倍率</span>
          <input
            type="text"
            inputMode="decimal"
            value={form.targetMultiplier}
            onChange={(e) => updateField("targetMultiplier", e.target.value)}
            placeholder="既定 2.0"
            className="rounded-md border border-black/10 dark:border-white/20 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[#52514e] dark:text-[#c3c2b7]">達成月数</span>
          <input
            type="text"
            inputMode="decimal"
            value={form.months}
            onChange={(e) => updateField("months", e.target.value)}
            placeholder="既定 12"
            className="rounded-md border border-black/10 dark:border-white/20 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
      </div>

      {showMismatch && (
        <p className="mt-3 text-sm text-[#fab219] bg-[#fab219]/10 border border-[#fab219]/30 rounded-md px-3 py-2">
          入力された月商（{formatYen(parsedMonthlySales)}）と、アクセス数×転換率×客単価から算出した売上（
          {formatYen(calculatedSales)}）が食い違っています。どちらも実測値のため自動では修正しません。念のためご確認ください。
        </p>
      )}

      <button
        type="submit"
        className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition-colors"
      >
        保存
      </button>
    </form>
  );
}
