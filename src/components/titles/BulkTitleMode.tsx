"use client";

import { useMemo, useState } from "react";
import { scoreTitle } from "@/lib/titleScore";
import { toCsv } from "@/lib/csv";
import Card from "@/components/ui/Card";
import { parseKeywords, scoreLabel, scoreToneClass } from "@/components/titles/titleUtils";

function downloadCsv(filename: string, text: string) {
  const blob = new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BulkTitleMode() {
  const [titlesText, setTitlesText] = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");

  const keywords = useMemo(() => parseKeywords(keywordsInput), [keywordsInput]);
  const titles = useMemo(
    () =>
      titlesText
        .split("\n")
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
    [titlesText],
  );

  const results = useMemo(
    () => titles.map((title) => ({ title, score: scoreTitle(title, keywords) })),
    [titles, keywords],
  );

  const handleExport = () => {
    const rows: (string | number)[][] = [
      ["商品名", "スコア", "バイト数", "文字数", "主な問題"],
      ...results.map(({ title, score }) => [
        title,
        score.score,
        score.byteLength,
        score.charLength,
        score.issues[0]?.message ?? "なし",
      ]),
    ];
    downloadCsv("title-scores.csv", toCsv(rows));
  };

  return (
    <Card title="一括採点モード" description="複数の商品名候補をまとめて採点します">
      <div className="flex flex-col gap-3 mb-4">
        <label className="text-sm font-medium">狙うキーワード（カンマまたはスペース区切り）</label>
        <input
          value={keywordsInput}
          onChange={(e) => setKeywordsInput(e.target.value)}
          placeholder="例: 犬 おやつ 無添加"
          className="rounded-md border border-black/10 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />

        <label className="text-sm font-medium">商品名候補（1行につき1商品名）</label>
        <textarea
          value={titlesText}
          onChange={(e) => setTitlesText(e.target.value)}
          rows={6}
          placeholder={"商品名1\n商品名2\n商品名3"}
          className="w-full rounded-md border border-black/10 dark:border-white/20 bg-transparent px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {results.length === 0 ? (
        <p className="text-sm text-center text-black/40 dark:text-white/40 py-4">
          商品名を入力すると採点結果がここに表示されます
        </p>
      ) : (
        <>
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={handleExport}
              className="rounded-md border border-black/10 dark:border-white/20 px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              CSV書き出し
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/10 dark:border-white/10 text-left text-[#52514e] dark:text-[#c3c2b7]">
                  <th className="py-2 pr-3">商品名</th>
                  <th className="py-2 pr-3">スコア</th>
                  <th className="py-2 pr-3">バイト数</th>
                  <th className="py-2">主な問題</th>
                </tr>
              </thead>
              <tbody>
                {results.map(({ title, score }, i) => (
                  <tr key={i} className="border-b border-black/5 dark:border-white/5 last:border-0">
                    <td className="py-2 pr-3 max-w-xs truncate" title={title}>
                      {title}
                    </td>
                    <td className={`py-2 pr-3 font-semibold ${scoreToneClass(score.score)}`}>
                      {score.score}（{scoreLabel(score.score)}）
                    </td>
                    <td
                      className={`py-2 pr-3 ${score.byteLength > 255 ? "text-[#d03b3b] font-semibold" : ""}`}
                    >
                      {score.byteLength}
                    </td>
                    <td className="py-2 max-w-sm truncate" title={score.issues[0]?.message}>
                      {score.issues.length === 0
                        ? "なし"
                        : `${score.issues[0].message}${score.issues.length > 1 ? ` 他${score.issues.length - 1}件` : ""}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}
