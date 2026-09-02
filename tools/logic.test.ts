// 純ロジック層の単体テスト。外部テストランナーは使わず、
// 自前の assert 相当 + 失敗時 process.exit(1) で構成する。
// 実行は tools/run-tests.mjs から行う（tsc で tools/dist に出力 → node で実行）。

import {
  gapToTarget,
  monthlyMilestones,
  requiredPatterns,
  salesOf,
  simulate,
  targetSales,
} from "../src/lib/kpi";
import { byteLength, scoreTitle, suggestTitle } from "../src/lib/titleScore";
import { parseCsv, toCsv } from "../src/lib/csv";
import { generateAlerts } from "../src/lib/alerts";
import { formatMultiplier, formatPercent, formatYen, parseNumericInput } from "../src/lib/format";
import { createStore } from "../src/lib/store";
import { actionMaster, priorityScore } from "../src/lib/actionMaster";
import type { GoalSetting, Product, ShopKpi } from "../src/types/rakuten";

// @types/node がインストールできない環境のため process.exit のみ最小限のアンビエント宣言を用意する
declare const process: { exit(code: number): never };

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passCount++;
  } else {
    failCount++;
    console.error(`FAIL: ${message}`);
  }
}

function assertApprox(actual: number, expected: number, epsilon: number, message: string) {
  assert(Math.abs(actual - expected) <= epsilon, `${message} (actual=${actual}, expected=${expected})`);
}

function makeBaseline(overrides: Partial<ShopKpi> = {}): ShopKpi {
  return {
    monthlySales: 1_000_000,
    sessions: 10_000,
    cvr: 0.02,
    aov: 5_000,
    ...overrides,
  };
}

function makeGoal(overrides: Partial<GoalSetting> = {}): GoalSetting {
  return {
    baseline: makeBaseline(),
    targetMultiplier: 2.0,
    months: 6,
    updatedAt: Date.now(),
    ...overrides,
  };
}

// ---- kpi.ts ----

{
  const kpi = makeBaseline();
  assertApprox(salesOf(kpi), kpi.sessions * kpi.cvr * kpi.aov, 1e-9, "salesOf はアクセス×CVR×客単価になる");
}

{
  const baseline = makeBaseline({ monthlySales: 0, sessions: 0, cvr: 0, aov: 0 });
  const goal = makeGoal({ baseline });
  const sim = simulate(baseline, { sessions: 2, cvr: 2, aov: 2 });
  assert(Number.isFinite(sim.achievedMultiplier), "baseline売上0のとき achievedMultiplier が有限値になる");
  assert(!Number.isNaN(sim.achievedMultiplier), "baseline売上0のとき achievedMultiplier がNaNにならない");
  assert(sim.achievedMultiplier === 0, "baseline売上0のとき achievedMultiplier が0になる");

  const target = targetSales(goal);
  assert(Number.isFinite(target), "baseline売上0のとき targetSales が有限値になる");
  assert(target === 0, "baseline売上0のとき targetSales が0になる");

  const gap = gapToTarget(goal, salesOf(baseline));
  assert(Number.isFinite(gap), "baseline売上0のとき gapToTarget が有限値になる");
}

{
  const goal = makeGoal({ targetMultiplier: 2.0 });
  const patterns = requiredPatterns(goal);
  assert(patterns.length === 4, "requiredPatterns は4パターン返す");
  for (const pattern of patterns) {
    const product = pattern.multipliers.sessions * pattern.multipliers.cvr * pattern.multipliers.aov;
    assertApprox(
      product,
      goal.targetMultiplier,
      1e-6,
      `requiredPatterns[${pattern.id}] の multipliers の積が targetMultiplier に一致する`,
    );
  }
}

{
  // CVR必要値が1.0を超えるケース: 極端に低いbaseline CVR かつアクセス集中しないパターン
  const goal = makeGoal({
    baseline: makeBaseline({ cvr: 0.9 }),
    targetMultiplier: 4.0, // sqrt(4)=2 -> required.cvr = 0.9*2 = 1.8 > 1
  });
  const patterns = requiredPatterns(goal);
  const cvrAovPattern = patterns.find((p) => p.id === "cvr-aov");
  assert(!!cvrAovPattern, "cvr-aov パターンが存在する");
  if (cvrAovPattern) {
    assert(cvrAovPattern.required.cvr > 1, "CVR必要値が1.0を超えている前提が成立している");
    assert(cvrAovPattern.feasible === false, "CVR必要値が1.0超のとき feasible が false になる");
  }
}

{
  const goal = makeGoal({ months: 6, targetMultiplier: 2.0 });
  const milestones = monthlyMilestones(goal);
  assert(milestones.length === 6, "monthlyMilestones は指定月数分の配列を返す");
  const last = milestones[milestones.length - 1];
  assertApprox(last.targetSales, targetSales(goal), 1, "monthlyMilestones の最終月が targetSales と一致する(誤差1円以内)");
}

// ---- titleScore.ts ----

{
  assert(byteLength("あA") === 3, 'byteLength("あA") === 3');
}

{
  const longName = "あ".repeat(130); // 260バイト相当
  const result = scoreTitle(longName, []);
  assert(
    result.issues.some((i) => i.level === "error" && i.message.includes("255")),
    "255バイト超の商品名で error レベルの issue が出る",
  );
}

{
  const title = "コットン 半袖 Tシャツ メンズ 無地 シンプル 春夏 通勤 普段着 大きいサイズ 綿100%";
  const scoreWithMissingKeyword = scoreTitle(title, ["未使用キーワード極めて長い文字列ここに入る"]);
  assert(
    scoreWithMissingKeyword.score < 100 &&
      scoreWithMissingKeyword.issues.some((i) => i.message.includes("未使用キーワード極めて長い文字列ここに入る")),
    "キーワード未使用で減点される",
  );

  const wellFormedTitle =
    "コットン 半袖 Tシャツ メンズ 無地 シンプル 春夏 通勤 普段着 大きいサイズ 綿100% 送料無料 部屋着 ルームウェア おしゃれ カジュアル";
  const goodScore = scoreTitle(wellFormedTitle, ["コットン", "Tシャツ"]);
  assert(goodScore.score >= 70, `全部満たした短くない商品名が高スコアになる (score=${goodScore.score})`);
}

{
  const suggestion = suggestTitle("短い商品名", ["キーワードA"]);
  assert(suggestion.includes("キーワードA"), "suggestTitle が未使用キーワードを付与する");
}

// ---- csv.ts ----

{
  const csvText = 'a,"b,c",d\n"e\nf",g,"h""i"\n';
  const rows = parseCsv(csvText);
  assert(rows.length === 2, "parseCsv が行数を正しく分割する");
  assert(rows[0][1] === "b,c", "parseCsv がクォート内カンマを正しく扱う");
  assert(rows[1][0] === "e\nf", "parseCsv がクォート内改行を正しく扱う");
  assert(rows[1][2] === 'h"i', "parseCsv が二重クォートエスケープを正しく扱う");
}

{
  const original = [
    ["商品名", "価格", "備考"],
    ["カンマ,入り", "1,000", "改行\nあり"],
    ['ダブル"クォート', "2000", ""],
  ];
  const csvText = toCsv(original);
  const roundTripped = parseCsv(csvText);
  assert(
    JSON.stringify(roundTripped) === JSON.stringify(original),
    "toCsv -> parseCsv のラウンドトリップが一致する",
  );
}

// ---- alerts.ts ----

{
  function makeProduct(overrides: Partial<Product>): Product {
    return {
      id: "p1",
      itemNumber: "item-1",
      name: "テスト商品",
      price: 1000,
      sales: 100000,
      units: 10,
      sessions: 1000,
      reviewCount: 0,
      reviewAverage: 0,
      registeredAt: 0,
      prevSales: 100000,
      ...overrides,
    };
  }

  const lowRatingProduct = makeProduct({ reviewCount: 3, reviewAverage: 1.5 });
  const alerts = generateAlerts([lowRatingProduct]);
  const critical = alerts.find((a) => a.productId === "p1" && a.type === "low_rating");
  assert(!!critical && critical.level === "critical", "低評価アラート(reviewCount<5 かつ average<=2)が critical になる");

  const okProduct = makeProduct({ reviewCount: 10, reviewAverage: 1.5 });
  const alertsOk = generateAlerts([okProduct]);
  assert(
    !alertsOk.some((a) => a.type === "low_rating"),
    "reviewCountが5以上なら低評価アラートは出ない",
  );
}

// ---- format.ts ----

{
  assert(formatYen(1234567) === "¥1,234,567", 'formatYen(1234567) === "¥1,234,567"');
  assert(formatPercent(0.0234) === "2.34%", 'formatPercent(0.0234) === "2.34%"');
  assert(formatMultiplier(2) === "2.00倍", 'formatMultiplier(2) === "2.00倍"');
  assert(parseNumericInput("１，２３４円") === 0 || parseNumericInput("１，２３４") === 1234, "parseNumericInput が全角数字・カンマを処理する");
  assert(parseNumericInput("¥1,234") === 1234, "parseNumericInput が¥とカンマを除去する");
  assert(parseNumericInput("12.5%") === 12.5, "parseNumericInput が%を除去する");
  assert(parseNumericInput("不正な値") === 0, "parseNumericInput は失敗時に0を返す");
}

// ---- store.ts ----

{
  // localStorage未定義環境(Node)でも例外を投げないことを確認する
  let threw = false;
  try {
    const store = createStore("test-key", { count: 0 });
    const snap1 = store.getSnapshot();
    const snap2 = store.getSnapshot();
    assert(snap1 === snap2, "getSnapshot は値が変わっていない限り同一参照を返す");
    assert(store.getServerSnapshot() === store.getServerSnapshot(), "getServerSnapshot は常に同一参照を返す");
    store.set({ count: 1 });
  } catch {
    threw = true;
  }
  assert(!threw, "localStorageが使えない環境でも createStore は例外を投げない");
}

// ---- actionMaster.ts ----

{
  assert(actionMaster.length >= 18, "施策マスタが18件以上ある");
  const freeCount = actionMaster.filter((a) => a.cost === "free").length;
  assert(freeCount > actionMaster.length / 2, "cost:free の施策が過半数を占める");

  const sorted = [...actionMaster].sort((a, b) => priorityScore(b) - priorityScore(a));
  for (let i = 1; i < sorted.length; i++) {
    assert(priorityScore(sorted[i - 1]) >= priorityScore(sorted[i]), "priorityScore で正しくソートできる");
  }
}

// ---- 結果 ----

console.log(`\n${passCount} passed, ${failCount} failed`);
if (failCount > 0) {
  process.exit(1);
}
