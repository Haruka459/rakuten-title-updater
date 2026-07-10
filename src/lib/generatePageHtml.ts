import type { ProductCard } from "@/types/shopPage";

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toMultiline(text: string): string {
  return escapeHtml(text).replaceAll("\n", "<br>");
}

function cardCell(card: ProductCard, widthPercent: number): string {
  const image = card.imageUrl
    ? `<img src="${escapeHtml(card.imageUrl)}" alt="${escapeHtml(card.title)}" width="100%" style="display:block;">`
    : "";
  const linkedImage =
    image && card.linkUrl
      ? `<a href="${escapeHtml(card.linkUrl)}">${image}</a>`
      : image;
  const title = card.title
    ? `<p style="margin:8px 0 4px;font-size:14px;font-weight:bold;">${
        card.linkUrl
          ? `<a href="${escapeHtml(card.linkUrl)}" style="color:#333333;text-decoration:none;">${escapeHtml(card.title)}</a>`
          : escapeHtml(card.title)
      }</p>`
    : "";
  const description = card.description
    ? `<p style="margin:0;font-size:12px;color:#666666;line-height:1.6;">${toMultiline(card.description)}</p>`
    : "";

  return [
    `<td width="${widthPercent}%" valign="top" style="padding:8px;">`,
    linkedImage,
    title,
    description,
    `</td>`,
  ]
    .filter(Boolean)
    .join("\n");
}

function sectionTable(cards: ProductCard[], widthPercent: number): string {
  const cells = cards.map((card) => cardCell(card, widthPercent)).join("\n");
  return [
    `<table width="100%" cellpadding="0" cellspacing="0" border="0">`,
    `<tr>`,
    cells,
    `</tr>`,
    `</table>`,
  ].join("\n");
}

/**
 * 上段（大画像×2）・下段（小画像×4）のページHTMLを組み立てる。
 * 楽天のページに貼り付けられるよう、インラインスタイルのみを使う。
 */
export function generatePageHtml(cards: ProductCard[]): string {
  const largeCards = cards.filter((card) => card.size === "large");
  const smallCards = cards.filter((card) => card.size === "small");
  return [
    `<!-- 上段：大画像×${largeCards.length} -->`,
    sectionTable(largeCards, Math.floor(100 / Math.max(largeCards.length, 1))),
    `<!-- 下段：小画像×${smallCards.length} -->`,
    sectionTable(smallCards, Math.floor(100 / Math.max(smallCards.length, 1))),
  ].join("\n");
}
