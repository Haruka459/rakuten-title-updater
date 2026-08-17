// アプリ全体で共有する localStorage ストアの定義。
// 各画面はここで定義したストアだけを使い、createStore を個別に呼ばない
// （キーの重複や画面ごとの状態分裂を防ぐため）。

import { createStore } from "@/lib/store";
import type { ActionItem, GoalSetting, Product, TitleDraft } from "@/types/rakuten";

const PREFIX = "rakuten-200:";

// 目標未設定でも画面が壊れないよう、すべて0の初期値を置く
export const DEFAULT_GOAL: GoalSetting = {
  baseline: { monthlySales: 0, sessions: 0, cvr: 0, aov: 0 },
  targetMultiplier: 2,
  months: 12,
  updatedAt: 0,
};

const EMPTY_PRODUCTS: Product[] = [];
const EMPTY_ACTIONS: ActionItem[] = [];
const EMPTY_TITLES: TitleDraft[] = [];
const EMPTY_CHECKS: Record<string, boolean> = {};

export const goalStore = createStore<GoalSetting>(`${PREFIX}goal`, DEFAULT_GOAL);
export const productsStore = createStore<Product[]>(`${PREFIX}products`, EMPTY_PRODUCTS);
export const actionsStore = createStore<ActionItem[]>(`${PREFIX}actions`, EMPTY_ACTIONS);
export const titlesStore = createStore<TitleDraft[]>(`${PREFIX}titles`, EMPTY_TITLES);

// イベント準備チェックの状態。キーは `${eventId}:${チェック項目のindex}`
export const eventChecksStore = createStore<Record<string, boolean>>(
  `${PREFIX}event-checks`,
  EMPTY_CHECKS,
);

// 設定画面のエクスポート/インポートで扱う全データのまとまり
export type AppBackup = {
  version: 1;
  exportedAt: number;
  goal: GoalSetting;
  products: Product[];
  actions: ActionItem[];
  titles: TitleDraft[];
  eventChecks: Record<string, boolean>;
};

export function exportBackup(): AppBackup {
  return {
    version: 1,
    exportedAt: Date.now(),
    goal: goalStore.getSnapshot(),
    products: productsStore.getSnapshot(),
    actions: actionsStore.getSnapshot(),
    titles: titlesStore.getSnapshot(),
    eventChecks: eventChecksStore.getSnapshot(),
  };
}

// 不正なJSONを読み込んでも既存データを壊さないよう、形が合う項目だけ復元する
export function importBackup(raw: string): { ok: boolean; message: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, message: "JSONとして読み取れませんでした。" };
  }
  if (typeof parsed !== "object" || parsed === null) {
    return { ok: false, message: "バックアップの形式が正しくありません。" };
  }

  const data = parsed as Partial<AppBackup>;
  let restored = 0;

  if (data.goal && typeof data.goal === "object" && data.goal.baseline) {
    goalStore.set(data.goal);
    restored++;
  }
  if (Array.isArray(data.products)) {
    productsStore.set(data.products);
    restored++;
  }
  if (Array.isArray(data.actions)) {
    actionsStore.set(data.actions);
    restored++;
  }
  if (Array.isArray(data.titles)) {
    titlesStore.set(data.titles);
    restored++;
  }
  if (data.eventChecks && typeof data.eventChecks === "object") {
    eventChecksStore.set(data.eventChecks);
    restored++;
  }

  if (restored === 0) {
    return { ok: false, message: "復元できるデータが含まれていませんでした。" };
  }
  return { ok: true, message: `${restored}件のデータを復元しました。` };
}

export function resetAll() {
  goalStore.reset();
  productsStore.reset();
  actionsStore.reset();
  titlesStore.reset();
  eventChecksStore.reset();
}
