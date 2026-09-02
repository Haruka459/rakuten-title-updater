// 施策のコスト区分・指標区分の表示用ラベルとスタイル定義。
// コスト区分は色だけでなく必ず文言（COST_LABEL）も併記して使うこと。

import type { CostTier, KpiLever } from "@/types/rakuten";

export const COST_LABEL: Record<CostTier, string> = {
  free: "無料でできる",
  ad: "広告費が必要",
  paid: "有料オプションが必要",
};

export const COST_BADGE_CLASS: Record<CostTier, string> = {
  free: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  ad: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  paid: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
};

export const LEVER_LABEL: Record<KpiLever, string> = {
  sessions: "アクセス",
  cvr: "転換率",
  aov: "客単価",
};
