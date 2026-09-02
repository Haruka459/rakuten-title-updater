"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/types/rakuten";
import { productsStore } from "@/lib/appStores";
import {
  formatDate,
  formatNumber,
  formatPercent,
  formatYen,
  parseNumericInput,
} from "@/lib/format";
import Card from "@/components/ui/Card";

type SortKey = "sales" | "sessions" | "cvr" | "reviewAverage";
type SortDir = "asc" | "desc";

// 商品CVR = units / sessions（sessions が0なら0除算を避けnullを返す）
function cvrOf(p: Product): number | null {
  return p.sessions > 0 ? p.units / p.sessions : null;
}

const SORT_LABEL: Record<SortKey, string> = {
  sales: "売上",
  sessions: "アクセス",
  cvr: "転換率",
  reviewAverage: "レビュー",
};

const emptyDraft = {
  itemNumber: "",
  name: "",
  price: "",
  sales: "",
  units: "",
  sessions: "",
  reviewCount: "",
  reviewAverage: "",
  registeredAt: "",
  prevSales: "",
};

export default function ProductTable({ products }: { products: Product[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("sales");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);

  const sorted = useMemo(() => {
    const withKey = products.map((p) => ({
      p,
      key: sortKey === "cvr" ? cvrOf(p) ?? -1 : p[sortKey],
    }));
    withKey.sort((a, b) => (sortDir === "asc" ? a.key - b.key : b.key - a.key));
    return withKey.map((w) => w.p);
  }, [products, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const handleDelete = (id: string) => {
    productsStore.update((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.itemNumber.trim() && !draft.name.trim()) return;
    const registeredAt = draft.registeredAt ? Date.parse(draft.registeredAt) : NaN;
    const newProduct: Product = {
      id: crypto.randomUUID(),
      itemNumber: draft.itemNumber.trim(),
      name: draft.name.trim(),
      price: parseNumericInput(draft.price),
      sales: parseNumericInput(draft.sales),
      units: parseNumericInput(draft.units),
      sessions: parseNumericInput(draft.sessions),
      reviewCount: parseNumericInput(draft.reviewCount),
      reviewAverage: parseNumericInput(draft.reviewAverage),
      registeredAt: Number.isFinite(registeredAt) ? registeredAt : 0,
      prevSales: parseNumericInput(draft.prevSales),
    };
    productsStore.update((prev) => [...prev, newProduct]);
    setDraft(emptyDraft);
    setShowForm(false);
  };

  return (
    <Card title="商品一覧" description="列見出しをクリックすると並べ替えられます">
      <div className="flex justify-end mb-3">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white font-medium hover:bg-blue-700 transition-colors"
        >
          {showForm ? "閉じる" : "商品を手入力で追加"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="mb-4 grid grid-cols-2 sm:grid-cols-5 gap-2 rounded-md border border-black/10 dark:border-white/10 p-3"
        >
          <input
            value={draft.itemNumber}
            onChange={(e) => setDraft({ ...draft, itemNumber: e.target.value })}
            placeholder="商品管理番号"
            className="rounded-md border border-black/10 dark:border-white/20 bg-transparent px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="商品名"
            className="col-span-2 rounded-md border border-black/10 dark:border-white/20 bg-transparent px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={draft.price}
            onChange={(e) => setDraft({ ...draft, price: e.target.value })}
            placeholder="価格"
            className="rounded-md border border-black/10 dark:border-white/20 bg-transparent px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={draft.sales}
            onChange={(e) => setDraft({ ...draft, sales: e.target.value })}
            placeholder="売上"
            className="rounded-md border border-black/10 dark:border-white/20 bg-transparent px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={draft.units}
            onChange={(e) => setDraft({ ...draft, units: e.target.value })}
            placeholder="販売個数"
            className="rounded-md border border-black/10 dark:border-white/20 bg-transparent px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={draft.sessions}
            onChange={(e) => setDraft({ ...draft, sessions: e.target.value })}
            placeholder="アクセス数"
            className="rounded-md border border-black/10 dark:border-white/20 bg-transparent px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={draft.reviewCount}
            onChange={(e) => setDraft({ ...draft, reviewCount: e.target.value })}
            placeholder="レビュー数"
            className="rounded-md border border-black/10 dark:border-white/20 bg-transparent px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={draft.reviewAverage}
            onChange={(e) => setDraft({ ...draft, reviewAverage: e.target.value })}
            placeholder="レビュー平均"
            className="rounded-md border border-black/10 dark:border-white/20 bg-transparent px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={draft.registeredAt}
            onChange={(e) => setDraft({ ...draft, registeredAt: e.target.value })}
            className="rounded-md border border-black/10 dark:border-white/20 bg-transparent px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={draft.prevSales}
            onChange={(e) => setDraft({ ...draft, prevSales: e.target.value })}
            placeholder="前期売上"
            className="rounded-md border border-black/10 dark:border-white/20 bg-transparent px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="col-span-2 sm:col-span-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white font-medium hover:bg-blue-700 transition-colors"
          >
            追加する
          </button>
        </form>
      )}

      {products.length === 0 ? (
        <p className="text-sm text-center text-black/40 dark:text-white/40 py-6">
          商品がありません
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-black/10 dark:border-white/10 text-left text-[#52514e] dark:text-[#c3c2b7]">
                <th className="py-2 pr-3">商品管理番号</th>
                <th className="py-2 pr-3">商品名</th>
                <th className="py-2 pr-3">価格</th>
                {(["sales", "sessions", "cvr", "reviewAverage"] as SortKey[]).map((key) => (
                  <th key={key} className="py-2 pr-3">
                    <button
                      type="button"
                      onClick={() => toggleSort(key)}
                      className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {SORT_LABEL[key]}
                      {sortKey === key && (sortDir === "asc" ? " ▲" : " ▼")}
                    </button>
                  </th>
                ))}
                <th className="py-2 pr-3">レビュー数</th>
                <th className="py-2 pr-3">登録日</th>
                <th className="py-2 pr-3">前期売上</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => {
                const cvr = cvrOf(p);
                return (
                  <tr
                    key={p.id}
                    className="border-b border-black/5 dark:border-white/5 last:border-0"
                  >
                    <td className="py-2 pr-3">{p.itemNumber || "-"}</td>
                    <td className="py-2 pr-3 max-w-xs truncate" title={p.name}>
                      {p.name || "-"}
                    </td>
                    <td className="py-2 pr-3">{formatYen(p.price)}</td>
                    <td className="py-2 pr-3">{formatYen(p.sales)}</td>
                    <td className="py-2 pr-3">{formatNumber(p.sessions)}</td>
                    <td className="py-2 pr-3">{cvr === null ? "-" : formatPercent(cvr)}</td>
                    <td className="py-2 pr-3">
                      {p.reviewCount}件（{p.reviewAverage.toFixed(1)}）
                    </td>
                    <td className="py-2 pr-3">
                      {formatDate(p.registeredAt)}
                    </td>
                    <td className="py-2 pr-3">{formatYen(p.prevSales)}</td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        aria-label="削除"
                        className="text-black/40 hover:text-red-600 dark:text-white/40 dark:hover:text-red-400 transition-colors"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
