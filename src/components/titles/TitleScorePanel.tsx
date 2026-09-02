"use client";

import type { TitleIssueLevel, TitleScore } from "@/types/rakuten";
import { scoreLabel, scoreToneClass } from "@/components/titles/titleUtils";

const MAX_BYTES = 255;

const ISSUE_ORDER: TitleIssueLevel[] = ["error", "warn", "info"];
const ISSUE_ICON: Record<TitleIssueLevel, string> = {
  error: "⛔",
  warn: "⚠️",
  info: "ℹ️",
};
const ISSUE_LABEL: Record<TitleIssueLevel, string> = {
  error: "エラー",
  warn: "注意",
  info: "参考",
};
const ISSUE_CLASS: Record<TitleIssueLevel, string> = {
  error: "border-[#d03b3b]/30 bg-[#d03b3b]/5",
  warn: "border-[#fab219]/40 bg-[#fab219]/10",
  info: "border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/5",
};

export default function TitleScorePanel({
  score,
  heading,
}: {
  score: TitleScore;
  heading?: string;
}) {
  const overByte = score.byteLength > MAX_BYTES;
  const sortedIssues = ISSUE_ORDER.flatMap((level) =>
    score.issues.filter((i) => i.level === level),
  );

  return (
    <div className="flex flex-col gap-4">
      {heading && <h3 className="text-sm font-semibold">{heading}</h3>}

      <div className="flex items-end gap-3">
        <span className={`text-4xl font-bold ${scoreToneClass(score.score)}`}>
          {score.score}
        </span>
        <span className="text-sm text-black/40 dark:text-white/40 mb-1">/ 100</span>
        <span className={`text-sm font-semibold mb-1 ${scoreToneClass(score.score)}`}>
          {scoreLabel(score.score)}
        </span>
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className={overByte ? "text-[#d03b3b] font-semibold" : "text-[#52514e] dark:text-[#c3c2b7]"}>
            バイト数: {score.byteLength} / {MAX_BYTES}（{score.charLength}文字）
          </span>
          {overByte && <span className="text-[#d03b3b] font-semibold">上限超過</span>}
        </div>
        <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
          <div
            className={`h-full ${overByte ? "bg-[#d03b3b]" : "bg-[#2a78d6] dark:bg-[#3987e5]"}`}
            style={{ width: `${Math.min(100, (score.byteLength / MAX_BYTES) * 100)}%` }}
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-[#52514e] dark:text-[#c3c2b7] mb-1.5">
          キーワード出現状況
        </p>
        {score.keywordHits.length === 0 ? (
          <p className="text-xs text-black/40 dark:text-white/40">キーワードが未入力です</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {score.keywordHits.map((hit) => (
              <li key={hit.keyword} className="text-xs flex justify-between gap-2">
                <span className="font-medium">{hit.keyword}</span>
                <span className={hit.count === 0 ? "text-[#d03b3b]" : "text-[#52514e] dark:text-[#c3c2b7]"}>
                  {hit.count === 0
                    ? "未出現"
                    : `${hit.count}回 / 初出位置 ${hit.index}文字目`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="text-xs font-medium text-[#52514e] dark:text-[#c3c2b7] mb-1.5">
          指摘事項（{score.issues.length}件）
        </p>
        {sortedIssues.length === 0 ? (
          <p className="text-xs text-[#0ca30c]">指摘事項はありません</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sortedIssues.map((issue, i) => (
              <li
                key={i}
                className={`rounded-md border px-3 py-2 text-xs ${ISSUE_CLASS[issue.level]}`}
              >
                <p className="font-medium">
                  <span aria-hidden="true">{ISSUE_ICON[issue.level]}</span>{" "}
                  【{ISSUE_LABEL[issue.level]}】{issue.message}
                </p>
                <p className="mt-1 text-[#52514e] dark:text-[#c3c2b7]">{issue.hint}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
