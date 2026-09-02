"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/useStore";
import { productsStore, titlesStore } from "@/lib/appStores";
import { scoreTitle, suggestTitle } from "@/lib/titleScore";
import type { TitleDraft } from "@/types/rakuten";
import Card from "@/components/ui/Card";
import TitleScorePanel from "@/components/titles/TitleScorePanel";
import BulkTitleMode from "@/components/titles/BulkTitleMode";
import { parseKeywords } from "@/components/titles/titleUtils";

export default function TitlesPage() {
  const products = useStore(productsStore);
  const drafts = useStore(titlesStore);

  const [itemNumber, setItemNumber] = useState("");
  const [title, setTitle] = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");
  const [suggestedText, setSuggestedText] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const keywords = useMemo(() => parseKeywords(keywordsInput), [keywordsInput]);
  const score = useMemo(() => scoreTitle(title, keywords), [title, keywords]);
  const suggestedScore = useMemo(
    () => (suggestedText ? scoreTitle(suggestedText, keywords) : null),
    [suggestedText, keywords],
  );

  const handleGenerateSuggestion = () => {
    setSuggestedText(suggestTitle(title, keywords));
  };

  const handleSave = () => {
    if (!title.trim()) return;
    const draft: TitleDraft = {
      id: editingId ?? crypto.randomUUID(),
      itemNumber: itemNumber.trim(),
      original: title,
      revised: suggestedText || title,
      keywords,
      updatedAt: Date.now(),
    };
    if (editingId) {
      titlesStore.update((prev) => prev.map((d) => (d.id === editingId ? draft : d)));
    } else {
      titlesStore.update((prev) => [...prev, draft]);
    }
    setEditingId(draft.id);
  };

  const handleLoadDraft = (draft: TitleDraft) => {
    setItemNumber(draft.itemNumber);
    setTitle(draft.original);
    setKeywordsInput(draft.keywords.join(" "));
    setSuggestedText(draft.revised !== draft.original ? draft.revised : "");
    setEditingId(draft.id);
  };

  const handleDeleteDraft = (id: string) => {
    titlesStore.update((prev) => prev.filter((d) => d.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleImportFromProducts = () => {
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;
    setItemNumber(product.itemNumber);
    setTitle(product.name);
    setSuggestedText("");
    setEditingId(null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold">商品名最適化</h1>

      {products.length > 0 && (
        <Card title="商品一覧から取り込む" description="商品パフォーマンス画面で取り込んだ商品名を読み取り専用で呼び出せます">
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="flex-1 min-w-[12rem] rounded-md border border-black/10 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">商品を選択...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.itemNumber} - {p.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleImportFromProducts}
              disabled={!selectedProductId}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:hover:bg-blue-600"
            >
              取り込む
            </button>
          </div>
        </Card>
      )}

      <Card title="商品名を入力">
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-sm font-medium">商品管理番号</label>
            <input
              value={itemNumber}
              onChange={(e) => setItemNumber(e.target.value)}
              className="mt-1 w-full rounded-md border border-black/10 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium">現在の商品名</label>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-black/10 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium">狙うキーワード（カンマまたはスペース区切り）</label>
            <input
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              placeholder="例: 犬 おやつ 無添加"
              className="mt-1 w-full rounded-md border border-black/10 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-2 mt-1">
            <button
              type="button"
              onClick={handleGenerateSuggestion}
              disabled={!title.trim()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:hover:bg-blue-600"
            >
              改善案を生成
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!title.trim()}
              className="rounded-md border border-black/10 dark:border-white/20 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-40"
            >
              {editingId ? "上書き保存" : "保存する"}
            </button>
          </div>
          <p className="text-xs text-[#52514e] dark:text-[#c3c2b7]">
            改善案の生成はAIを使用していません。ルールに基づく規則ベースの処理のみでブラウザ内で完結します。
          </p>
        </div>
      </Card>

      <div className={`grid gap-4 ${suggestedScore ? "sm:grid-cols-2" : ""}`}>
        <Card title={suggestedScore ? undefined : "採点結果"}>
          <TitleScorePanel score={score} heading={suggestedScore ? "現在の商品名" : undefined} />
        </Card>
        {suggestedScore && (
          <Card>
            <div className="flex flex-col gap-3">
              <TitleScorePanel score={suggestedScore} heading="改善案" />
              <div>
                <label className="text-xs font-medium text-[#52514e] dark:text-[#c3c2b7]">
                  改善案（編集可能）
                </label>
                <textarea
                  value={suggestedText}
                  onChange={(e) => setSuggestedText(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-black/10 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </Card>
        )}
      </div>

      <Card title="保存した商品名" description={`${drafts.length}件`}>
        {drafts.length === 0 ? (
          <p className="text-sm text-center text-black/40 dark:text-white/40 py-4">
            保存された商品名はありません
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {drafts.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-3 rounded-md border border-black/10 dark:border-white/10 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-xs text-[#52514e] dark:text-[#c3c2b7]">{d.itemNumber || "(番号未設定)"}</p>
                  <p className="text-sm truncate" title={d.revised}>
                    {d.revised}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleLoadDraft(d)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    呼び出し
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteDraft(d.id)}
                    aria-label="削除"
                    className="text-black/40 hover:text-red-600 dark:text-white/40 dark:hover:text-red-400 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <BulkTitleMode />
    </div>
  );
}
