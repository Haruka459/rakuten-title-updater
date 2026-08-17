// アラート判定（低評価・レビュー不足・CVR低下・売上減・新商品）。
// docs/PLAN.md 第11章準拠。すべて純関数。

import type { Alert, Product } from "@/types/rakuten";

const FEW_REVIEWS_THRESHOLD = 5;
const LOW_RATING_THRESHOLD = 2;
const CVR_DROP_MIN_SESSIONS = 100;
const CVR_DROP_RATIO = 0.5;
const SALES_DROP_RATIO = 0.8;
const NEW_PRODUCT_DAYS = 30;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

// 商品CVR = units / sessions（sessions が 0 なら判定対象外として 0 を返す）
function productCvr(p: Product): number {
  return p.sessions > 0 ? p.units / p.sessions : 0;
}

// 店舗平均CVR = 全商品(アクセスありのもの)の合計販売個数 / 合計アクセス数
export function shopAverageCvr(products: Product[]): number {
  const withSessions = products.filter((p) => p.sessions > 0);
  const totalUnits = withSessions.reduce((sum, p) => sum + p.units, 0);
  const totalSessions = withSessions.reduce((sum, p) => sum + p.sessions, 0);
  if (totalSessions === 0) return 0;
  const ratio = totalUnits / totalSessions;
  return Number.isFinite(ratio) ? ratio : 0;
}

export function generateAlerts(products: Product[]): Alert[] {
  const avgCvr = shopAverageCvr(products);
  const alerts: Alert[] = [];

  for (const p of products) {
    // 低評価アラート
    if (p.reviewCount < FEW_REVIEWS_THRESHOLD && p.reviewAverage > 0 && p.reviewAverage <= LOW_RATING_THRESHOLD) {
      alerts.push({
        id: `${p.id}-low-rating`,
        productId: p.id,
        type: "low_rating",
        level: "critical",
        message: `「${p.name}」の評価が低くなっています（平均${p.reviewAverage.toFixed(1)}）`,
      });
    }

    // レビュー不足
    if (p.reviewCount < FEW_REVIEWS_THRESHOLD) {
      alerts.push({
        id: `${p.id}-few-reviews`,
        productId: p.id,
        type: "few_reviews",
        level: "warning",
        message: `「${p.name}」のレビュー数が不足しています（${p.reviewCount}件）`,
      });
    }

    // CVR低下（店舗平均の50%未満、かつアクセス100以上）
    if (p.sessions >= CVR_DROP_MIN_SESSIONS && avgCvr > 0) {
      const cvr = productCvr(p);
      if (cvr < avgCvr * CVR_DROP_RATIO) {
        alerts.push({
          id: `${p.id}-cvr-drop`,
          productId: p.id,
          type: "cvr_drop",
          level: "serious",
          message: `「${p.name}」のCVRが店舗平均の半分未満です`,
        });
      }
    }

    // 売上減（前期比80%未満）
    if (p.sales < p.prevSales * SALES_DROP_RATIO) {
      alerts.push({
        id: `${p.id}-sales-drop`,
        productId: p.id,
        type: "sales_drop",
        level: "serious",
        message: `「${p.name}」の売上が前期比80%未満に落ち込んでいます`,
      });
    }

    // 新商品（登録から30日以内）
    if (p.registeredAt > 0) {
      const daysSinceRegistered = (Date.now() - p.registeredAt) / MS_PER_DAY;
      if (daysSinceRegistered >= 0 && daysSinceRegistered <= NEW_PRODUCT_DAYS) {
        alerts.push({
          id: `${p.id}-new`,
          productId: p.id,
          type: "new_product",
          level: "good",
          message: `「${p.name}」は新商品です（登録${Math.floor(daysSinceRegistered)}日経過）`,
        });
      }
    }
  }

  return alerts;
}
