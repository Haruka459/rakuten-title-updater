// 売上分解・目標逆算・月次マイルストーン。すべて純関数。
// ゼロ除算・NaN・Infinity を絶対に出さない。

import type {
  GoalSetting,
  LeverMultipliers,
  LeverPattern,
  Milestone,
  ProjectedKpi,
  ShopKpi,
  SimResult,
} from "@/types/rakuten";

// ゼロ除算・非有限値を安全に処理する割り算。異常時は fallback（既定 0）を返す。
function safeRatio(numerator: number, denominator: number, fallback = 0): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return fallback;
  }
  const r = numerator / denominator;
  return Number.isFinite(r) ? r : fallback;
}

// 非負の実数として安全にべき乗を計算する（負値・非有限値は 0 扱い）
function safePow(base: number, exponent: number): number {
  const safeBase = Number.isFinite(base) && base > 0 ? base : 0;
  const result = Math.pow(safeBase, exponent);
  return Number.isFinite(result) ? result : 0;
}

export function salesOf(kpi: ShopKpi): number {
  const sales = kpi.sessions * kpi.cvr * kpi.aov;
  return Number.isFinite(sales) ? sales : 0;
}

export function targetSales(goal: GoalSetting): number {
  const sales = goal.baseline.monthlySales * goal.targetMultiplier;
  return Number.isFinite(sales) ? sales : 0;
}

export function gapToTarget(goal: GoalSetting, current: number): number {
  return targetSales(goal) - current;
}

function applyMultipliers(baseline: ShopKpi, m: LeverMultipliers, goalTargetSales: number): ShopKpi {
  return {
    monthlySales: goalTargetSales,
    sessions: baseline.sessions * m.sessions,
    cvr: baseline.cvr * m.cvr,
    aov: baseline.aov * m.aov,
  };
}

function makePattern(
  id: string,
  label: string,
  description: string,
  multipliers: LeverMultipliers,
  goal: GoalSetting,
): LeverPattern {
  const required = applyMultipliers(goal.baseline, multipliers, targetSales(goal));
  return {
    id,
    label,
    description,
    multipliers,
    required,
    feasible: required.cvr <= 1,
  };
}

// 目標倍率 M に対する4つの逆算パターン
export function requiredPatterns(goal: GoalSetting): LeverPattern[] {
  const M = Number.isFinite(goal.targetMultiplier) && goal.targetMultiplier > 0 ? goal.targetMultiplier : 0;
  const cubeRoot = safePow(M, 1 / 3);
  const sqrtM = safePow(M, 1 / 2);
  const quadRoot = safePow(M, 1 / 4);

  return [
    makePattern(
      "access",
      "アクセス集中型",
      "アクセス数だけを伸ばして目標倍率を達成するパターン。広告・集客施策に集中する。",
      { sessions: M, cvr: 1, aov: 1 },
      goal,
    ),
    makePattern(
      "balanced",
      "バランス型",
      "アクセス・転換率・客単価を均等に伸ばすパターン。3指標それぞれ M^(1/3) 倍にする。",
      { sessions: cubeRoot, cvr: cubeRoot, aov: cubeRoot },
      goal,
    ),
    makePattern(
      "cvr-aov",
      "転換率・客単価型",
      "アクセスは増やさず、商品ページ改善と客単価アップだけで目標倍率を達成するパターン。",
      { sessions: 1, cvr: sqrtM, aov: sqrtM },
      goal,
    ),
    makePattern(
      "realistic",
      "現実配分型",
      "アクセスを最も重視しつつ、転換率・客単価も少しずつ改善する現実的な配分パターン。",
      { sessions: sqrtM, cvr: quadRoot, aov: quadRoot },
      goal,
    ),
  ];
}

// months ヶ月で targetMultiplier に到達する複利成長率で月次目標売上を分割する
export function monthlyMilestones(goal: GoalSetting): Milestone[] {
  const months = Math.floor(goal.months);
  if (!Number.isFinite(months) || months <= 0) return [];

  const M = Number.isFinite(goal.targetMultiplier) && goal.targetMultiplier > 0 ? goal.targetMultiplier : 0;
  const r = safePow(M, 1 / months);

  const milestones: Milestone[] = [];
  for (let n = 1; n <= months; n++) {
    const rawSales = goal.baseline.monthlySales * Math.pow(r, n);
    milestones.push({
      month: n,
      label: `${n}ヶ月目`,
      targetSales: Number.isFinite(rawSales) ? rawSales : 0,
      growthRate: r,
    });
  }
  return milestones;
}

// baseline に multipliers を適用したときの試算結果
export function simulate(
  baseline: ShopKpi,
  multipliers: LeverMultipliers,
  targetMultiplier = 1,
): SimResult {
  const projected: ProjectedKpi = {
    sessions: baseline.sessions * multipliers.sessions,
    cvr: baseline.cvr * multipliers.cvr,
    aov: baseline.aov * multipliers.aov,
  };
  const projectedSalesRaw = projected.sessions * projected.cvr * projected.aov;
  const projectedSales = Number.isFinite(projectedSalesRaw) ? projectedSalesRaw : 0;

  const baselineSales = salesOf(baseline);
  const achievedMultiplier = safeRatio(projectedSales, baselineSales, 0);

  const safeTarget = Number.isFinite(targetMultiplier) ? targetMultiplier : 1;
  const reachesGoal = achievedMultiplier >= safeTarget;

  return { projected, projectedSales, achievedMultiplier, reachesGoal };
}
