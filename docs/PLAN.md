# 楽天市場 売上200%目標対策ツール — 設計仕様書

参考: エンパタウン株式会社「エンパポータル」（楽天市場店舗運営効率化ツール群）の
機能思想を参考に、**追加費用ゼロ**で同等の意思決定支援を行うツールを自作する。

## 0. 絶対制約（コスト）

> 「ユーザーの現在のプラン額以上の料金がかからないように作成すること」

このため以下を **設計の絶対条件** とする。

| 項目 | 方針 |
|---|---|
| 外部API | **一切呼ばない**（楽天API・LLM API・解析SaaS すべて不使用） |
| バックエンド/DB | **持たない**。サーバーコンポーネントは静的描画のみ |
| データ保存 | ブラウザ `localStorage` のみ（ユーザー端末内で完結） |
| 新規npmパッケージ | **追加しない**（グラフも手書きSVG。既存の next/react/tailwind のみ） |
| ホスティング | 静的出力可能な構成に留め、無料枠で動く |
| 楽天の有料オプション | 前提にしない（CSV一括編集オプション等が無くても全機能が動く） |

データ投入は「手入力」と「CSV貼り付け/取込」の2経路のみ。RMSからダウンロードした
CSVをユーザーが読み込ませる想定で、通信は発生しない。

## 1. 中核となる考え方

```
売上 = アクセス数 × 転換率(CVR) × 客単価
```

売上200%（2.0倍）は、3指標の改善率の**積**が 2.0 を超えれば達成できる。
本ツールは「2.0倍という漠然とした目標」を、指標ごとの必要改善率 → 具体施策 →
月次マイルストーン → 進捗管理、まで分解して落とし込むことを唯一の目的とする。

例: アクセス1.4倍 × CVR1.2倍 × 客単価1.2倍 = 2.016倍 → 達成

## 2. 機能一覧（画面 = ルート）

| ルート | 画面名 | 役割 |
|---|---|---|
| `/` | ダッシュボード | 目標逆算の結果、達成率、アラート、次のアクション |
| `/simulator` | KPIシミュレーター | 3指標スライダーで倍率をライブ計算、達成パターン提案 |
| `/products` | 商品パフォーマンス | 商品別売上/アクセス/CVR/レビュー、CSV取込、上位/新商品/低評価 |
| `/titles` | 商品名最適化 | 楽天SEO観点で商品名を採点・改善提案（255バイト制限等） |
| `/actions` | 施策プランナー | 施策マスタから選定、優先度スコア、進捗管理 |
| `/calendar` | 年間イベント対策 | 楽天イベント年間カレンダーと準備チェックリスト |
| `/settings` | データ管理 | JSONエクスポート/インポート、初期化 |

## 3. ファイル構成

```
src/types/rakuten.ts            型定義（全機能共通）
src/lib/store.ts                localStorage 汎用ストア（useSyncExternalStore対応）
src/lib/format.ts               数値・通貨・パーセントの表示整形
src/lib/kpi.ts                  売上分解・目標逆算・月次マイルストーン
src/lib/titleScore.ts           商品名スコアリング（楽天SEO）
src/lib/csv.ts                  CSVパース/生成
src/lib/actionMaster.ts         施策マスタ（静的データ）
src/lib/eventCalendar.ts        楽天イベントマスタ（静的データ）
src/lib/alerts.ts               アラート判定（低評価・在庫切れ・目標未達）
src/components/AppNav.tsx       共通ナビゲーション
src/components/charts/*.tsx     SVGチャート（Gauge / BarChart / LineChart）
src/components/<機能>/*.tsx     各画面のクライアントコンポーネント
src/app/<route>/page.tsx        各ルート
```

**削除**: `src/components/TodoApp.tsx` / `src/lib/todoStore.ts` / `src/types/todo.ts`
（Next.js雛形のToDoサンプル。`/` がダッシュボードに置き換わるため到達不能になる）

## 4. 既存コードの規約（必ず踏襲すること）

`AGENTS.md` にある通り、この Next.js は学習データと異なる可能性がある。
**唯一の信頼できる手本はこのリポジトリの既存コード**である（`node_modules` が
インストール不能な環境のため公式docsは参照できない）。以下を厳守する。

- クライアント側の状態を持つコンポーネントは先頭に `"use client";`
- import は `@/` エイリアス（`@/lib/...`, `@/types/...`）
- localStorage の購読は `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)`
  で行う。**SSRとの不整合を避けるため `getServerSnapshot` は必ず不変の空値を返す**
  （`src/lib/todoStore.ts` と同じ形）
- スタイルは Tailwind のユーティリティクラスのみ。`dark:` バリアントでダークモード対応
- 日本語UI。`src/app/layout.tsx` の `<html lang="ja">` を維持
- 新規パッケージの import は禁止（`react` / `next` / 自作モジュールのみ）

## 5. 型定義（`src/types/rakuten.ts`）

```ts
export type ShopKpi = {
  monthlySales: number;   // 月商(円)
  sessions: number;       // 月間アクセス数
  cvr: number;            // 転換率(0-1)
  aov: number;            // 客単価(円)
};

export type GoalSetting = {
  baseline: ShopKpi;      // 現状
  targetMultiplier: number; // 目標倍率（200% = 2.0）
  months: number;         // 達成までの月数
  updatedAt: number;
};

export type Product = {
  id: string;
  itemNumber: string;     // 商品管理番号
  name: string;           // 商品名
  price: number;
  sales: number;          // 期間売上(円)
  units: number;          // 販売個数
  sessions: number;       // アクセス数
  reviewCount: number;
  reviewAverage: number;  // 0-5
  registeredAt: number;   // 登録日(epoch ms)
  prevSales: number;      // 前期売上（前月比・前年比用）
};

export type ActionStatus = "todo" | "doing" | "done";

export type ActionItem = {
  id: string;
  masterId: string | null; // 施策マスタ由来ならそのID
  title: string;
  lever: KpiLever;         // どの指標を上げる施策か
  impact: number;          // 1-5 期待インパクト
  effort: number;          // 1-5 必要工数
  cost: CostTier;
  status: ActionStatus;
  dueDate: string | null;  // "YYYY-MM-DD"
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
```

## 6. 計算ロジック仕様（`src/lib/kpi.ts`）

すべて純関数。副作用・DOM参照を持たせない（単体テスト対象）。

```ts
salesOf(kpi): number                      // sessions * cvr * aov
targetSales(goal): number                 // baseline.monthlySales * targetMultiplier
gapToTarget(goal, current): number         // 目標売上 - 現状売上
```

### 6.1 逆算パターン `requiredPatterns(goal): LeverPattern[]`

目標倍率 M に対し、以下4パターンを返す（各 lever の必要倍率と必要絶対値）。

| パターン名 | 配分 |
|---|---|
| アクセス集中型 | sessions = M, cvr = 1, aov = 1 |
| バランス型 | 3指標均等: 各 M^(1/3) |
| 転換率・客単価型 | sessions = 1, cvr = √M, aov = √M |
| 現実配分型 | sessions = M^0.5, cvr = M^0.25, aov = M^0.25 |

各パターンは `{ id, label, description, multipliers: {sessions,cvr,aov}, required: ShopKpi }`
を返す。`required.cvr` は **1.0(100%)を超える場合に到達不可フラグを立てる**
（`feasible: boolean`）。CVRは物理的に100%を超えられない。

### 6.2 月次マイルストーン `monthlyMilestones(goal): Milestone[]`

`months` ヶ月で `targetMultiplier` に到達する**複利成長率**で分割する。

```
r = targetMultiplier ** (1 / months)
月nの目標売上 = baseline.monthlySales * r**n   (n = 1..months)
```

戻り値 `{ month: number; label: string; targetSales: number; growthRate: number }[]`

### 6.3 シミュレーション `simulate(baseline, multipliers): SimResult`

```
projected = { sessions: baseline.sessions * m.sessions, cvr: ..., aov: ... }
projectedSales = projected.sessions * projected.cvr * projected.aov
achievedMultiplier = projectedSales / baselineSales
```
`{ projected, projectedSales, achievedMultiplier, reachesGoal: boolean }`

### 6.4 端数・ゼロ除算

- baseline の売上が 0 のとき、倍率計算は `0` を返し `NaN`/`Infinity` を出さない
- `cvr` は内部では小数（0.0234）、UIでは % 表示（2.34%）。変換は `format.ts` に集約
- 金額は表示時のみ `Math.round`。計算途中で丸めない

## 7. 商品名スコアリング仕様（`src/lib/titleScore.ts`）

楽天市場の商品名は **全角127文字 / 255バイト** が上限（Shift_JIS換算相当）。
ここでは実用的に「**全角=2バイト、半角=1バイト**」で概算する。

```ts
byteLength(s: string): number   // 半角(ASCII/半角カナ)=1, それ以外=2
scoreTitle(title: string, keywords: string[]): TitleScore
```

`TitleScore`:
```ts
{
  score: number;            // 0-100
  byteLength: number;
  charLength: number;
  issues: TitleIssue[];     // { level: "error"|"warn"|"info", message, hint }
  keywordHits: { keyword: string; index: number; count: number }[];
}
```

### 減点ルール

| チェック | 条件 | レベル | 減点 |
|---|---|---|---|
| バイト超過 | byteLength > 255 | error | 30 |
| 短すぎ | byteLength < 60 | warn | 15 |
| キーワード未使用 | keywords のうち未出現がある | error | 未出現1語につき 10（最大30） |
| 重要語が後方 | 先頭30バイト以内に keywords[0] が無い | warn | 10 |
| キーワード過剰反復 | 同一キーワードが3回以上 | warn | 10 |
| 記号の乱用 | `【】` `★` `※` `!` 等の装飾記号が合計8個超 | warn | 10 |
| 連続スペース/全角空白の乱れ | 2つ以上連続する空白 | info | 5 |
| 禁止表現 | 「最安値」「日本一」「No.1」「激安」等の断定表現 | warn | 10 |
| 区切りなし | 半角スペース区切りが1つも無い | info | 5 |

`score = clamp(100 - 合計減点, 0, 100)`。`issues` には必ず **改善のヒント文**（`hint`）を
日本語で添える。ヒントは静的な定型文で良い（LLM呼び出しは禁止）。

### 提案生成 `suggestTitle(title, keywords): string`

規則ベースのみ。①未使用キーワードを先頭に付与 ②連続空白を1つに正規化
③255バイトを超える場合は末尾から語単位で切り詰め。**AIは使わない**。

## 8. CSV仕様（`src/lib/csv.ts`）

```ts
parseCsv(text: string): string[][]        // ダブルクォート・改行・エスケープ対応
toCsv(rows: (string|number)[][]): string  // 必要なセルのみクォート
```

商品CSVの想定ヘッダ（日本語ヘッダを名前で照合し、順序に依存しない）:

`商品管理番号, 商品名, 価格, 売上, 販売個数, アクセス数, レビュー数, レビュー平均, 登録日, 前期売上`

- ヘッダ照合は**空白除去 + 完全一致**。見つからない列は 0 / 空文字で埋める
- 数値パースは全角数字・カンマ・円記号を除去してから `Number()`
- パース失敗行は捨てずに `errors: string[]` として画面に返す
- 文字コードは `FileReader.readAsText(file, "Shift_JIS")` と UTF-8 の
  両対応（画面側にエンコーディング選択を置く）

## 9. 施策マスタ（`src/lib/actionMaster.ts`）

`{ id, lever, title, description, impact, effort, cost }` の静的配列。
最低18件。**cost が `free` のものを過半数**にする（コスト制約の趣旨）。

- **アクセス(sessions)**: 商品名SEO最適化 / 検索キーワード見直し / RPP広告(ad) /
  クーポンアドバンス(ad) / メルマガ配信 / SNS導線 / お買い物マラソン参加 /
  ランキング入賞狙いの集中販売 / 商品点数の拡充
- **転換率(cvr)**: 商品ページ1st View改善 / レビュー訴求画像の設置 /
  送料無料ラインの明示 / スマホ表示最適化 / Q&A・不安要素の先回り記載 /
  在庫切れ・入荷待ちの解消
- **客単価(aov)**: セット販売・まとめ買い割引 / 同梱提案(クロスセル) /
  送料無料ラインの引き上げ / 上位グレード品の併記

`priorityScore(item) = impact * 2 - effort`（降順で並べる）。

## 10. 年間イベント（`src/lib/eventCalendar.ts`）

`{ id, name, months: number[], recurrence, prepDays, checklist: string[] }`

- 楽天スーパーSALE（3・6・9・12月）
- お買い物マラソン（ほぼ毎月）
- 5と0のつく日（毎月5,10,15,20,25,30日）
- ブラックフライデー（11月）
- 楽天大感謝祭（12月）
- 各イベントに準備チェックリスト（クーポン設定 / 商品ページ更新 / 在庫確保 /
  広告予算調整 / メルマガ予告）を3〜5項目

**注意**: 開催時期は年により変動するため、UIに「実際の開催日はRMSの
お知らせで必ず確認してください」の注記を必ず表示する。

## 11. アラート判定（`src/lib/alerts.ts`）

| 種別 | 条件 | レベル |
|---|---|---|
| 低評価アラート | `reviewCount < 5 && reviewAverage > 0 && reviewAverage <= 2` | critical |
| レビュー不足 | `reviewCount < 5` | warning |
| CVR低下 | 商品CVR < 店舗平均CVRの50% かつ アクセス100以上 | serious |
| 売上減 | `sales < prevSales * 0.8` | serious |
| 新商品 | 登録から30日以内 | good（アラートではなく強調表示） |

商品CVR = `units / sessions`（sessions が 0 なら判定対象外）。

## 12. チャート仕様（`src/components/charts/`）

`dataviz` スキルの規約に従う。**外部チャートライブラリは使わず素のSVG**で描く。

- 検証済みカテゴリカル配色を固定順で使う（循環させない）
  1. blue `#2a78d6` (dark `#3987e5`) / 2. orange `#eb6834` (`#d95926`)
  3. aqua `#1baf7a` (`#199e70`) / 4. yellow `#eda100` (`#c98500`)
- ステータス色（系列色に流用しない）: good `#0ca30c` / warning `#fab219` /
  serious `#ec835a` / critical `#d03b3b`
- 軸・グリッドは控えめに: グリッド `#e1e0d9`(dark `#2c2c2a`)、軸ラベル `#898781`
- **2軸グラフは禁止**（指標が違うものは別チャートに分ける）
- 系列2本以上のときは必ず凡例を置く（色だけで識別させない）
- 数値ラベルは全点に付けない。要点のみ直接ラベル
- 棒の端は 4px 角丸、線は 2px、積み上げ・隣接棒の間は 2px の隙間
- ダークモードは `dark:` クラスで**個別に指定**（自動反転に頼らない）

必要なチャート:
1. `Gauge` — 目標達成率（半円ゲージ、0-100%超過も表示）
2. `BarChart` — 商品別売上 上位10（横棒）
3. `LineChart` — 月次マイルストーン vs 実績（2系列、凡例あり）

## 13. 検証手順（実装後に必ず実行）

`node_modules` がインストールできない環境のため `next build` は動かない。
代わりに以下で検証する。

```bash
# 1. 純ロジックの型チェック（react/next に依存しないファイルのみ）
tsc --noEmit --strict --target ES2020 --module esnext --moduleResolution bundler \
    src/types/rakuten.ts src/lib/kpi.ts src/lib/titleScore.ts src/lib/csv.ts \
    src/lib/format.ts src/lib/alerts.ts src/lib/actionMaster.ts src/lib/eventCalendar.ts

# 2. 単体テスト（tools/ の検証スクリプトを tsc でJSに変換して node で実行）
node tools/run-tests.mjs
```

`.tsx` は react/next の型が無いため完全な型チェックはできない。
レビュー時は「既存 `TodoApp.tsx` と同じ書き方になっているか」を人手で確認する。

## 14. 役割分担

- **設計・仕様策定・レビュー・検証**: 上位モデル
- **実装（コード記述・修正）**: 下位モデル（サブエージェント）

サブエージェントには本ファイルの該当セクションを指定して作業させる。
