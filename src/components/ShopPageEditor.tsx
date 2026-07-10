"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import type { ProductCard } from "@/types/shopPage";
import { generatePageHtml } from "@/lib/generatePageHtml";
import {
  getServerSnapshot,
  getSnapshot,
  moveCard,
  resetCards,
  subscribe,
  updateCard,
} from "@/lib/shopPageStore";

const fieldClass =
  "w-full rounded-md border border-black/10 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500";

function CardPreviewImage({ card }: { card: ProductCard }) {
  if (!card.imageUrl) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-md bg-black/5 dark:bg-white/10 text-xs text-black/40 dark:text-white/40">
        画像未設定
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 任意の外部URLをそのままプレビューするため
    <img
      src={card.imageUrl}
      alt={card.title}
      className="w-full rounded-md object-cover"
    />
  );
}

function CardEditor({
  card,
  positionLabel,
  isFirstInGroup,
  isLastInGroup,
}: {
  card: ProductCard;
  positionLabel: string;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-black/10 dark:border-white/10 p-4">
      <header className="flex items-center justify-between gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            card.size === "large"
              ? "bg-blue-600/10 text-blue-700 dark:text-blue-300"
              : "bg-emerald-600/10 text-emerald-700 dark:text-emerald-300"
          }`}
        >
          {positionLabel}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => moveCard(card.id, "prev")}
            disabled={isFirstInGroup}
            aria-label="前へ移動"
            className="rounded-md border border-black/10 dark:border-white/20 px-2 py-1 text-xs hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => moveCard(card.id, "next")}
            disabled={isLastInGroup}
            aria-label="次へ移動"
            className="rounded-md border border-black/10 dark:border-white/20 px-2 py-1 text-xs hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30"
          >
            →
          </button>
        </div>
      </header>

      <CardPreviewImage card={card} />

      <label className="flex flex-col gap-1 text-xs text-black/60 dark:text-white/60">
        画像URL
        <input
          type="url"
          value={card.imageUrl}
          onChange={(e) => updateCard(card.id, { imageUrl: e.target.value })}
          placeholder="https://image.rakuten.co.jp/..."
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-black/60 dark:text-white/60">
        リンク先URL
        <input
          type="url"
          value={card.linkUrl}
          onChange={(e) => updateCard(card.id, { linkUrl: e.target.value })}
          placeholder="https://item.rakuten.co.jp/..."
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-black/60 dark:text-white/60">
        タイトル
        <input
          type="text"
          value={card.title}
          onChange={(e) => updateCard(card.id, { title: e.target.value })}
          placeholder="商品名・キャッチコピー"
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-black/60 dark:text-white/60">
        商品説明
        <textarea
          value={card.description}
          onChange={(e) => updateCard(card.id, { description: e.target.value })}
          placeholder="商品の説明文"
          rows={3}
          className={`${fieldClass} resize-y`}
        />
      </label>
    </section>
  );
}

function LayoutPreview({ cards }: { cards: ProductCard[] }) {
  const largeCards = cards.filter((card) => card.size === "large");
  const smallCards = cards.filter((card) => card.size === "small");
  const previewCell = (card: ProductCard) => (
    <div key={card.id} className="flex flex-col gap-1">
      <CardPreviewImage card={card} />
      {card.title && <p className="text-sm font-bold">{card.title}</p>}
      {card.description && (
        <p className="whitespace-pre-wrap text-xs text-black/60 dark:text-white/60">
          {card.description}
        </p>
      )}
    </div>
  );
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-black/10 dark:border-white/10 p-4">
      <div className="grid grid-cols-2 gap-3">{largeCards.map(previewCell)}</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {smallCards.map(previewCell)}
      </div>
    </div>
  );
}

export default function ShopPageEditor() {
  const cards = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [copied, setCopied] = useState(false);

  const html = useMemo(() => generatePageHtml(cards), [cards]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // クリップボードが使えない環境ではテキストエリアから手動コピーしてもらう
    }
  };

  const handleReset = () => {
    if (window.confirm("すべてのカードを初期状態に戻しますか？")) {
      resetCards();
    }
  };

  // 段（サイズ）内での通し番号を付けてカードごとの編集枠を並べる
  const groupCounts: Record<string, number> = {};
  const editors = cards.map((card) => {
    const groupSize = cards.filter((c) => c.size === card.size).length;
    groupCounts[card.size] = (groupCounts[card.size] ?? 0) + 1;
    const numberInGroup = groupCounts[card.size];
    const positionLabel =
      card.size === "large"
        ? `上段・大画像 ${numberInGroup}/${groupSize}`
        : `下段・小画像 ${numberInGroup}/${groupSize}`;
    return (
      <CardEditor
        key={card.id}
        card={card}
        positionLabel={positionLabel}
        isFirstInGroup={numberInGroup === 1}
        isLastInGroup={numberInGroup === groupSize}
      />
    );
  });

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col gap-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">ショップページ カード編集</h1>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            上段（大画像×2）・下段（小画像×4）の各枠を、配置に関係なくカード単位で編集できます。
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-md border border-black/10 dark:border-white/20 px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          初期状態に戻す
        </button>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">カード編集</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {editors}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">ページプレビュー</h2>
        <LayoutPreview cards={cards} />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">貼り付け用HTML</h2>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            {copied ? "コピーしました" : "HTMLをコピー"}
          </button>
        </div>
        <textarea
          value={html}
          readOnly
          rows={12}
          className={`${fieldClass} font-mono text-xs resize-y`}
        />
      </section>
    </div>
  );
}
