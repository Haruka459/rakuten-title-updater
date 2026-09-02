// 商品名スコアリング（楽天SEO観点）。docs/PLAN.md 第7章準拠。
// 規則ベースのみ。LLM/外部APIは一切使わない。

import type { KeywordHit, TitleIssue, TitleScore } from "@/types/rakuten";

const MAX_BYTES = 255;
const MIN_RECOMMENDED_BYTES = 60;
const LEADING_KEYWORD_BYTES = 30;
const MAX_REPEAT_COUNT = 3;
const MAX_DECOR_SYMBOLS = 8;

const DECOR_SYMBOL_RE = /[【】★☆※!!◆●▼▲♪○◇■□▽△]/g;
const FORBIDDEN_PHRASES = ["最安値", "日本一", "No.1", "NO.1", "no.1", "激安", "世界一", "業界一"];
const WHITESPACE_RUN_RE = /[ 　]{2,}/;

// 半角(ASCII可視文字・半角カナ)=1バイト、それ以外(全角等)=2バイトとして概算する
export function byteLength(s: string): number {
  let total = 0;
  for (const ch of Array.from(s)) {
    const code = ch.codePointAt(0) ?? 0;
    const isHalfWidth = (code >= 0x20 && code <= 0x7e) || (code >= 0xff61 && code <= 0xff9f);
    total += isHalfWidth ? 1 : 2;
  }
  return total;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let pos = 0;
  for (;;) {
    const idx = haystack.indexOf(needle, pos);
    if (idx === -1) break;
    count++;
    pos = idx + needle.length;
  }
  return count;
}

function leadingBytesSlice(s: string, maxBytes: number): string {
  let bytes = 0;
  let result = "";
  for (const ch of Array.from(s)) {
    const code = ch.codePointAt(0) ?? 0;
    const isHalfWidth = (code >= 0x20 && code <= 0x7e) || (code >= 0xff61 && code <= 0xff9f);
    const w = isHalfWidth ? 1 : 2;
    if (bytes + w > maxBytes) break;
    bytes += w;
    result += ch;
  }
  return result;
}

export function scoreTitle(title: string, keywords: string[]): TitleScore {
  const issues: TitleIssue[] = [];
  let deduction = 0;

  const bLen = byteLength(title);
  const cLen = Array.from(title).length;

  // バイト超過
  if (bLen > MAX_BYTES) {
    issues.push({
      level: "error",
      message: `商品名が${MAX_BYTES}バイトを超えています（現在${bLen}バイト）`,
      hint: "商品名を短くしてください。目安は255バイト（全角127文字）以内です。",
    });
    deduction += 30;
  }

  // 短すぎ
  if (bLen < MIN_RECOMMENDED_BYTES) {
    issues.push({
      level: "warn",
      message: `商品名が短すぎます（現在${bLen}バイト、推奨${MIN_RECOMMENDED_BYTES}バイト以上）`,
      hint: "商品の特徴・素材・サイズ・用途などのキーワードを追加して情報量を増やしましょう。",
    });
    deduction += 15;
  }

  // キーワードヒット集計
  const keywordHits: KeywordHit[] = keywords.map((keyword) => ({
    keyword,
    index: title.indexOf(keyword),
    count: countOccurrences(title, keyword),
  }));

  // キーワード未使用
  const missingKeywords = keywordHits.filter((h) => h.count === 0);
  if (missingKeywords.length > 0) {
    for (const h of missingKeywords) {
      issues.push({
        level: "error",
        message: `キーワード「${h.keyword}」が商品名に含まれていません`,
        hint: "検索されやすい重要語は必ず商品名に含めてください。",
      });
    }
    deduction += Math.min(missingKeywords.length * 10, 30);
  }

  // 重要語(keywords[0])が後方
  if (keywords.length > 0) {
    const primary = keywords[0];
    const leading = leadingBytesSlice(title, LEADING_KEYWORD_BYTES);
    if (!leading.includes(primary)) {
      issues.push({
        level: "warn",
        message: `最重要キーワード「${primary}」が先頭${LEADING_KEYWORD_BYTES}バイト以内にありません`,
        hint: "楽天SEOでは商品名の先頭ほど検索評価が高くなります。最重要キーワードは先頭付近に配置しましょう。",
      });
      deduction += 10;
    }
  }

  // キーワード過剰反復
  const overRepeated = keywordHits.filter((h) => h.count >= MAX_REPEAT_COUNT);
  if (overRepeated.length > 0) {
    for (const h of overRepeated) {
      issues.push({
        level: "warn",
        message: `キーワード「${h.keyword}」が${h.count}回繰り返されています`,
        hint: "同じキーワードの繰り返しはスパム判定や可読性低下につながります。3回未満に抑えましょう。",
      });
    }
    deduction += 10;
  }

  // 記号の乱用
  const decorMatches = title.match(DECOR_SYMBOL_RE);
  const decorCount = decorMatches ? decorMatches.length : 0;
  if (decorCount > MAX_DECOR_SYMBOLS) {
    issues.push({
      level: "warn",
      message: `装飾記号が多すぎます（${decorCount}個）`,
      hint: "【】★※!などの装飾記号は8個以内に抑え、読みやすさを優先しましょう。",
    });
    deduction += 10;
  }

  // 連続スペース/全角空白の乱れ
  if (WHITESPACE_RUN_RE.test(title)) {
    issues.push({
      level: "info",
      message: "連続する空白（半角/全角）があります",
      hint: "空白は1つずつ区切りに使い、連続させないようにしましょう。",
    });
    deduction += 5;
  }

  // 禁止表現
  const hasForbidden = FORBIDDEN_PHRASES.some((phrase) => title.includes(phrase));
  if (hasForbidden) {
    issues.push({
      level: "warn",
      message: "断定的な表現（最安値・日本一・No.1・激安等）が含まれています",
      hint: "根拠のない断定表現は薬機法・景品表示法等に抵触する恐れがあるため避けましょう。",
    });
    deduction += 10;
  }

  // 区切りなし
  if (!title.includes(" ")) {
    issues.push({
      level: "info",
      message: "半角スペースによる区切りがありません",
      hint: "商品名は半角スペースで意味のまとまりごとに区切ると検索エンジンに認識されやすくなります。",
    });
    deduction += 5;
  }

  const score = clamp(100 - deduction, 0, 100);

  return {
    score,
    byteLength: bLen,
    charLength: cLen,
    issues,
    keywordHits,
  };
}

// 規則ベースの商品名改善提案。①未使用キーワードを先頭に付与
// ②連続空白を1つに正規化 ③255バイトを超える場合は末尾から語単位で切り詰め
export function suggestTitle(title: string, keywords: string[]): string {
  const missing = keywords.filter((k) => k.length > 0 && !title.includes(k));
  let result = missing.length > 0 ? `${missing.join(" ")} ${title}` : title;

  result = result.replace(/[ 　]{2,}/g, " ").trim();

  while (byteLength(result) > MAX_BYTES) {
    const words = result.split(" ");
    if (words.length <= 1) {
      const chars = Array.from(result);
      if (chars.length === 0) break;
      result = chars.slice(0, -1).join("");
      continue;
    }
    words.pop();
    result = words.join(" ");
  }

  return result;
}
