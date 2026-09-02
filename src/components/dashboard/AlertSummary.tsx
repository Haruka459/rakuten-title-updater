"use client";

// アラート要約。productsStore の商品から generateAlerts を呼び、
// critical/serious の件数と優先度順の先頭5件を表示する（docs/PLAN.md 2章-6）。

import { productsStore } from "@/lib/appStores";
import { useStore } from "@/lib/useStore";
import { generateAlerts } from "@/lib/alerts";
import { formatNumber } from "@/lib/format";
import type { Alert } from "@/types/rakuten";
import Card from "@/components/ui/Card";

const LEVEL_LABEL: Record<Alert["level"], string> = {
  critical: "重大",
  serious: "深刻",
  warning: "注意",
  good: "朗報",
};

const LEVEL_CLASS: Record<Alert["level"], string> = {
  critical: "text-[#d03b3b]",
  serious: "text-[#ec835a]",
  warning: "text-[#fab219]",
  good: "text-[#0ca30c]",
};

const LEVEL_ORDER: Record<Alert["level"], number> = {
  critical: 0,
  serious: 1,
  warning: 2,
  good: 3,
};

export default function AlertSummary() {
  const products = useStore(productsStore);
  const alerts = generateAlerts(products);

  const criticalCount = alerts.filter((a) => a.level === "critical").length;
  const seriousCount = alerts.filter((a) => a.level === "serious").length;
  const topAlerts = [...alerts].sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]).slice(0, 5);

  return (
    <Card title="アラート要約" description="商品データから検出した優先対応事項">
      {products.length === 0 ? (
        <p className="text-sm text-[#52514e] dark:text-[#c3c2b7]">
          商品データを取り込むと、低評価商品やCVR低下などのアラートが表示されます。「商品分析」画面からCSVを取り込んでください。
        </p>
      ) : (
        <>
          <p className="text-sm mb-3">
            <span className="font-semibold text-[#d03b3b]">重大 {formatNumber(criticalCount)}件</span>
            {" / "}
            <span className="font-semibold text-[#ec835a]">深刻 {formatNumber(seriousCount)}件</span>
          </p>
          {topAlerts.length === 0 ? (
            <p className="text-sm text-[#52514e] dark:text-[#c3c2b7]">重大・深刻なアラートはありません。</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {topAlerts.map((a) => (
                <li key={a.id} className={LEVEL_CLASS[a.level]}>
                  [{LEVEL_LABEL[a.level]}] {a.message}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Card>
  );
}
