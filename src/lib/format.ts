// 数値・通貨・パーセントの表示整形。すべて純関数。

function safeNumber(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

export function formatYen(n: number): string {
  const value = Math.round(safeNumber(n));
  return `¥${value.toLocaleString("ja-JP")}`;
}

export function formatNumber(n: number): string {
  const value = Math.round(safeNumber(n));
  return value.toLocaleString("ja-JP");
}

export function formatPercent(rate: number, digits = 2): string {
  const value = safeNumber(rate) * 100;
  return `${value.toFixed(digits)}%`;
}

export function formatMultiplier(m: number): string {
  return `${safeNumber(m).toFixed(2)}倍`;
}

// 全角数字・カンマ・"¥"・"%"を除去して数値化する。失敗時は 0 を返す。
export function parseNumericInput(s: string): number {
  if (typeof s !== "string") return 0;
  const halfWidth = s.replace(/[０-９]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xff10 + 0x30),
  );
  const cleaned = halfWidth
    .replace(/,/g, "")
    .replace(/[¥￥]/g, "")
    .replace(/[%％]/g, "")
    .trim();
  if (cleaned === "") return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

// epoch ms を "YYYY-MM-DD" に整形する。
// toLocaleDateString はサーバー(UTC)とブラウザ(JST)で結果がずれて
// ハイドレーション不整合を起こすため、UTC基準で決定的に整形する。
export function formatDate(ts: number): string {
  if (!Number.isFinite(ts) || ts <= 0) return "-";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toISOString().slice(0, 10);
}
