// titles画面専用の小さなヘルパー。lib配下は他エージェントが担当しているため触れない。

// カンマ・読点・空白（半角/全角）区切りのキーワード入力を配列に変換する
export function parseKeywords(input: string): string[] {
  return input
    .split(/[,、\s　]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function scoreLabel(score: number): string {
  if (score >= 80) return "良好";
  if (score >= 50) return "改善余地あり";
  return "要改善";
}

export function scoreToneClass(score: number): string {
  if (score >= 80) return "text-[#0ca30c]";
  if (score >= 50) return "text-[#fab219]";
  return "text-[#d03b3b]";
}
