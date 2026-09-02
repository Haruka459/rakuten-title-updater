"use client";

import type { Alert, AlertLevel } from "@/types/rakuten";
import Card from "@/components/ui/Card";

// critical→serious→warning の順に表示する（good=新商品は別セクションで表示するため除外）
const LEVEL_ORDER: AlertLevel[] = ["critical", "serious", "warning"];

const LEVEL_LABEL: Record<AlertLevel, string> = {
  critical: "重大",
  serious: "要注意",
  warning: "注意",
  good: "良好",
};

// 色だけでなくラベル文言も併記する
const LEVEL_CLASS: Record<AlertLevel, string> = {
  critical: "border-[#d03b3b]/30 bg-[#d03b3b]/5 text-[#d03b3b]",
  serious: "border-[#ec835a]/30 bg-[#ec835a]/5 text-[#ec835a]",
  warning: "border-[#fab219]/40 bg-[#fab219]/10 text-[#a86a00] dark:text-[#fab219]",
  good: "border-[#0ca30c]/30 bg-[#0ca30c]/5 text-[#0ca30c]",
};

export default function AlertsList({ alerts }: { alerts: Alert[] }) {
  const visible = LEVEL_ORDER.flatMap((level) => alerts.filter((a) => a.level === level));

  return (
    <Card title="アラート" description="対応の優先度が高い順に表示しています">
      {visible.length === 0 ? (
        <p className="text-sm text-black/40 dark:text-white/40 py-4 text-center">
          現在アラートはありません
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((alert) => (
            <li
              key={alert.id}
              className={`rounded-md border px-3 py-2 text-sm flex items-start gap-2 ${LEVEL_CLASS[alert.level]}`}
            >
              <span className="font-semibold shrink-0">【{LEVEL_LABEL[alert.level]}】</span>
              <span>{alert.message}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
