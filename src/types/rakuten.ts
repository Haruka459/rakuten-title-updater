// 楽天市場 売上200%目標対策ツール — 共通型定義
// docs/PLAN.md 第5章 準拠。各 lib が返す型もここに集約する。

export type ShopKpi = {
  monthlySales: number; // 月商(円)
  sessions: number; // 月間アクセス数
  cvr: number; // 転換率(0-1)
  aov: number; // 客単価(円)
};

export type GoalSetting = {
  baseline: ShopKpi; // 現状
  targetMultiplier: number; // 目標倍率（200% = 2.0）
  months: number; // 達成までの月数
  updatedAt: number;
};

export type Product = {
  id: string;
  itemNumber: string; // 商品管理番号
  name: string; // 商品名
  price: number;
  sales: number; // 期間売上(円)
  units: number; // 販売個数
  sessions: number; // アクセス数
  reviewCount: number;
  reviewAverage: number; // 0-5
  registeredAt: number; // 登録日(epoch ms)
  prevSales: number; // 前期売上（前月比・前年比用）
};

export type ActionStatus = "todo" | "doing" | "done";

export type ActionItem = {
  id: string;
  masterId: string | null; // 施策マスタ由来ならそのID
  title: string;
  lever: KpiLever; // どの指標を上げる施策か
  impact: number; // 1-5 期待インパクト
  effort: number; // 1-5 必要工数
  cost: CostTier;
  status: ActionStatus;
  dueDate: string | null; // "YYYY-MM-DD"
  note: string;
};

export type KpiLever = "sessions" | "cvr" | "aov";
export type CostTier = "free" | "ad" | "paid"; // 無料 / 広告費要 / 有料オプション要

export type TitleDraft = {
  id: string;
  itemNumber: string;
  original: string;
  revised: string;
  keywords: string[];
  updatedAt: number;
};

// ---- src/lib/kpi.ts が返す型 ----

// 3指標それぞれに掛ける倍率
export type LeverMultipliers = {
  sessions: number;
  cvr: number;
  aov: number;
};

export type LeverPattern = {
  id: string;
  label: string;
  description: string;
  multipliers: LeverMultipliers;
  required: ShopKpi;
  feasible: boolean; // required.cvr が 1.0(100%) を超える場合 false
};

export type Milestone = {
  month: number;
  label: string;
  targetSales: number;
  growthRate: number; // 複利成長率 r（月あたり倍率）
};

// simulate() の projected は monthlySales を含まない3指標のみ
export type ProjectedKpi = {
  sessions: number;
  cvr: number;
  aov: number;
};

export type SimResult = {
  projected: ProjectedKpi;
  projectedSales: number;
  achievedMultiplier: number;
  reachesGoal: boolean;
};

// ---- src/lib/titleScore.ts が返す型 ----

export type TitleIssueLevel = "error" | "warn" | "info";

export type TitleIssue = {
  level: TitleIssueLevel;
  message: string;
  hint: string;
};

export type KeywordHit = {
  keyword: string;
  index: number; // 初出位置（未出現なら -1）
  count: number;
};

export type TitleScore = {
  score: number; // 0-100
  byteLength: number;
  charLength: number;
  issues: TitleIssue[];
  keywordHits: KeywordHit[];
};

// ---- src/lib/alerts.ts が返す型 ----

export type AlertLevel = "critical" | "warning" | "serious" | "good";

export type AlertType =
  | "low_rating"
  | "few_reviews"
  | "cvr_drop"
  | "sales_drop"
  | "new_product";

export type Alert = {
  id: string;
  productId: string;
  type: AlertType;
  level: AlertLevel;
  message: string;
};

// ---- src/lib/actionMaster.ts が返す型 ----

export type ActionMasterItem = {
  id: string;
  lever: KpiLever;
  title: string;
  description: string;
  impact: number; // 1-5
  effort: number; // 1-5
  cost: CostTier;
};

// ---- src/lib/eventCalendar.ts が返す型 ----

export type EventRecurrence = "yearly" | "monthly" | "monthly-fixed-dates";

export type RakutenEvent = {
  id: string;
  name: string;
  months: number[]; // 開催される可能性がある月（1-12）
  recurrence: EventRecurrence;
  prepDays: number; // 準備に要する目安日数
  checklist: string[];
};

// ---- src/lib/csv.ts が返す型 ----

export type ParsedProductsCsv = {
  products: Product[];
  errors: string[];
};
