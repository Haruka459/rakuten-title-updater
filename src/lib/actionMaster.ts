// 施策マスタ（静的データ）。docs/PLAN.md 第9章準拠。
// 追加費用ゼロが前提のため cost: "free" が過半数になるよう構成する。

import type { ActionMasterItem } from "@/types/rakuten";

export const actionMaster: ActionMasterItem[] = [
  // ---- アクセス(sessions) ----
  {
    id: "sessions-title-seo",
    lever: "sessions",
    title: "商品名SEO最適化",
    description: "検索されやすいキーワードを商品名の前方に配置し、検索流入を増やす。",
    impact: 4,
    effort: 2,
    cost: "free",
  },
  {
    id: "sessions-keyword-review",
    lever: "sessions",
    title: "検索キーワード見直し",
    description: "楽天市場内検索で流入のあるキーワードを分析し、商品ページ全体に反映する。",
    impact: 3,
    effort: 2,
    cost: "free",
  },
  {
    id: "sessions-rpp-ad",
    lever: "sessions",
    title: "RPP広告",
    description: "検索連動型広告で露出を増やす。クリック課金のため広告費が発生する。",
    impact: 4,
    effort: 2,
    cost: "ad",
  },
  {
    id: "sessions-coupon-advance",
    lever: "sessions",
    title: "クーポンアドバンス",
    description: "クーポン経由の露出枠を活用して集客する。利用には広告費が発生する。",
    impact: 3,
    effort: 1,
    cost: "ad",
  },
  {
    id: "sessions-mail-magazine",
    lever: "sessions",
    title: "メルマガ配信",
    description: "既存顧客・フォロワー向けにメールマガジンを配信し再訪を促す。",
    impact: 3,
    effort: 2,
    cost: "free",
  },
  {
    id: "sessions-sns",
    lever: "sessions",
    title: "SNS導線",
    description: "SNSアカウントから商品ページへの導線を作り、外部流入を増やす。",
    impact: 2,
    effort: 2,
    cost: "free",
  },
  {
    id: "sessions-shopping-marathon",
    lever: "sessions",
    title: "お買い物マラソン参加",
    description: "楽天のセールイベントに合わせて商品を出展し、イベント流入を取り込む。",
    impact: 4,
    effort: 2,
    cost: "free",
  },
  {
    id: "sessions-ranking-push",
    lever: "sessions",
    title: "ランキング入賞狙いの集中販売",
    description: "特定期間に販売を集中させ、ジャンルランキング入賞による露出増を狙う。",
    impact: 4,
    effort: 3,
    cost: "free",
  },
  {
    id: "sessions-item-expansion",
    lever: "sessions",
    title: "商品点数の拡充",
    description: "取扱商品数を増やし、検索・回遊経由の流入機会そのものを増やす。",
    impact: 3,
    effort: 4,
    cost: "free",
  },

  // ---- 転換率(cvr) ----
  {
    id: "cvr-first-view",
    lever: "cvr",
    title: "商品ページ1st View改善",
    description: "訪問直後に見える範囲で商品の魅力・安心材料が伝わるよう構成を見直す。",
    impact: 5,
    effort: 3,
    cost: "free",
  },
  {
    id: "cvr-review-images",
    lever: "cvr",
    title: "レビュー訴求画像の設置",
    description: "高評価レビューを画像として商品ページに掲載し、購入の後押しにする。",
    impact: 4,
    effort: 2,
    cost: "free",
  },
  {
    id: "cvr-free-shipping-line",
    lever: "cvr",
    title: "送料無料ラインの明示",
    description: "送料無料の条件をわかりやすく明示し、購入時の離脱を減らす。",
    impact: 3,
    effort: 1,
    cost: "free",
  },
  {
    id: "cvr-mobile-optimization",
    lever: "cvr",
    title: "スマホ表示最適化",
    description: "スマートフォンでの見え方・タップしやすさを改善し、離脱を防ぐ。",
    impact: 4,
    effort: 3,
    cost: "free",
  },
  {
    id: "cvr-qanda",
    lever: "cvr",
    title: "Q&A・不安要素の先回り記載",
    description: "よくある質問やサイズ・使用感などの不安要素を事前にページへ記載する。",
    impact: 3,
    effort: 2,
    cost: "free",
  },
  {
    id: "cvr-stockout-resolution",
    lever: "cvr",
    title: "在庫切れ・入荷待ちの解消",
    description: "在庫切れ状態を放置しない。機会損失を防ぎ購入導線を維持する。",
    impact: 4,
    effort: 2,
    cost: "free",
  },

  // ---- 客単価(aov) ----
  {
    id: "aov-set-bundle",
    lever: "aov",
    title: "セット販売・まとめ買い割引",
    description: "複数個・複数商品のセット販売で1回あたりの購入単価を上げる。",
    impact: 4,
    effort: 2,
    cost: "free",
  },
  {
    id: "aov-cross-sell",
    lever: "aov",
    title: "同梱提案（クロスセル）",
    description: "関連商品をカート追加画面などで提案し、ついで買いを促す。",
    impact: 3,
    effort: 2,
    cost: "free",
  },
  {
    id: "aov-free-shipping-raise",
    lever: "aov",
    title: "送料無料ラインの引き上げ",
    description: "送料無料になる購入金額のラインを引き上げ、まとめ買いを誘導する。",
    impact: 3,
    effort: 1,
    cost: "free",
  },
  {
    id: "aov-upper-grade",
    lever: "aov",
    title: "上位グレード品の併記",
    description: "同一ページ内で上位グレード・大容量品を併記し、アップセルを狙う。",
    impact: 3,
    effort: 2,
    cost: "free",
  },
];

export function priorityScore(item: ActionMasterItem): number {
  return item.impact * 2 - item.effort;
}

// 優先度スコア（impact*2 - effort）の降順で並べる
export function sortByPriority(items: ActionMasterItem[] = actionMaster): ActionMasterItem[] {
  return [...items].sort((a, b) => priorityScore(b) - priorityScore(a));
}
