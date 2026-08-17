"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/useStore";
import { productsStore } from "@/lib/appStores";
import { generateAlerts, shopAverageCvr } from "@/lib/alerts";
import { toCsv } from "@/lib/csv";
import { formatNumber, formatPercent, formatYen } from "@/lib/format";
import Card from "@/components/ui/Card";
import StatTile from "@/components/ui/StatTile";
import BarChart from "@/components/charts/BarChart";
import CsvImportPanel from "@/components/products/CsvImportPanel";
import ProductTable from "@/components/products/ProductTable";
import AlertsList from "@/components/products/AlertsList";

const NEW_PRODUCT_DAYS = 30;
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const EXPORT_HEADER = [
  "商品管理番号",
  "商品名",
  "価格",
  "売上",
  "販売個数",
  "アクセス数",
  "レビュー数",
  "レビュー平均",
  "登録日",
  "前期売上",
];

function downloadCsv(filename: string, text: string) {
  // BOM付きにしてExcelでも文字化けしないようにする
  const blob = new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ProductsPage() {
  const products = useStore(productsStore);
  const alerts = useMemo(() => generateAlerts(products), [products]);

  const totalSales = products.reduce((sum, p) => sum + p.sales, 0);
  const totalPrevSales = products.reduce((sum, p) => sum + p.prevSales, 0);
  const avgCvr = shopAverageCvr(products);
  const salesRatio = totalPrevSales > 0 ? totalSales / totalPrevSales : 0;
  const ratioDelta = totalPrevSales > 0 ? salesRatio - 1 : 0;

  const top10 = useMemo(
    () =>
      [...products]
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 10)
        .map((p) => ({ label: p.name || p.itemNumber || "(名称未設定)", value: p.sales })),
    [products],
  );

  const newProducts = useMemo(
    () =>
      products.filter((p) => {
        if (p.registeredAt <= 0) return false;
        const days = (Date.now() - p.registeredAt) / MS_PER_DAY;
        return days >= 0 && days <= NEW_PRODUCT_DAYS;
      }),
    [products],
  );

  const handleExport = () => {
    const rows: (string | number)[][] = [
      EXPORT_HEADER,
      ...products.map((p) => [
        p.itemNumber,
        p.name,
        p.price,
        p.sales,
        p.units,
        p.sessions,
        p.reviewCount,
        p.reviewAverage,
        p.registeredAt > 0 ? new Date(p.registeredAt).toISOString().slice(0, 10) : "",
        p.prevSales,
      ]),
    ];
    downloadCsv("products.csv", toCsv(rows));
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold">商品パフォーマンス</h1>

      <CsvImportPanel />

      {products.length === 0 ? (
        <Card title="商品データがありません">
          <p className="text-sm text-[#52514e] dark:text-[#c3c2b7]">
            上の「CSV取込」から楽天RMSでダウンロードした商品CSVを読み込むか、テキストを貼り付けてください。
            右下の「商品を手入力で追加」から1件ずつ入力することもできます。
          </p>
        </Card>
      ) : (
        <>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleExport}
              className="rounded-md border border-black/10 dark:border-white/20 px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              CSV書き出し
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatTile label="商品数" value={formatNumber(products.length)} />
            <StatTile label="合計売上" value={formatYen(totalSales)} />
            <StatTile label="店舗平均転換率" value={formatPercent(avgCvr)} />
            <StatTile
              label="前期比"
              value={totalPrevSales > 0 ? formatPercent(salesRatio) : "-"}
              delta={
                totalPrevSales > 0
                  ? `${ratioDelta >= 0 ? "+" : ""}${formatPercent(ratioDelta)}`
                  : undefined
              }
              tone={ratioDelta >= 0 ? "good" : "bad"}
            />
          </div>

          <Card title="売上上位10商品">
            <BarChart data={top10} valueFormatter={formatYen} />
          </Card>

          <AlertsList alerts={alerts} />

          <Card title="新商品" description={`登録から${NEW_PRODUCT_DAYS}日以内の商品`}>
            {newProducts.length === 0 ? (
              <p className="text-sm text-black/40 dark:text-white/40 py-4 text-center">
                該当する新商品はありません
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5 text-sm">
                {newProducts.map((p) => (
                  <li key={p.id} className="flex justify-between gap-2">
                    <span className="truncate">{p.name || p.itemNumber}</span>
                    <span className="text-[#52514e] dark:text-[#c3c2b7] shrink-0">
                      {new Date(p.registeredAt).toLocaleDateString("ja-JP")} 登録
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <ProductTable products={products} />
        </>
      )}
    </div>
  );
}
