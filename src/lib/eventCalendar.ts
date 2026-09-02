// 楽天イベントマスタ（静的データ）。docs/PLAN.md 第10章準拠。
// 開催時期は年により変動するため、UIでは必ず下記 EVENT_CALENDAR_DISCLAIMER を表示すること。

import type { RakutenEvent } from "@/types/rakuten";

export const EVENT_CALENDAR_DISCLAIMER =
  "実際の開催日はRMSのお知らせで必ず確認してください。";

const STANDARD_CHECKLIST = [
  "クーポン設定",
  "商品ページ更新",
  "在庫確保",
  "広告予算調整",
  "メルマガ予告",
];

export const eventCalendar: RakutenEvent[] = [
  {
    id: "super-sale",
    name: "楽天スーパーSALE",
    months: [3, 6, 9, 12],
    recurrence: "yearly",
    prepDays: 14,
    checklist: STANDARD_CHECKLIST,
  },
  {
    id: "shopping-marathon",
    name: "お買い物マラソン",
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    recurrence: "monthly",
    prepDays: 7,
    checklist: ["クーポン設定", "商品ページ更新", "在庫確保", "メルマガ予告"],
  },
  {
    id: "go-to-day",
    name: "5と0のつく日",
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    recurrence: "monthly-fixed-dates",
    prepDays: 3,
    checklist: ["クーポン設定", "在庫確保", "広告予算調整"],
  },
  {
    id: "black-friday",
    name: "ブラックフライデー",
    months: [11],
    recurrence: "yearly",
    prepDays: 21,
    checklist: STANDARD_CHECKLIST,
  },
  {
    id: "grand-thanksgiving",
    name: "楽天大感謝祭",
    months: [12],
    recurrence: "yearly",
    prepDays: 21,
    checklist: STANDARD_CHECKLIST,
  },
];

// 指定した月(1-12)に該当するイベントを返す
export function eventsForMonth(month: number): RakutenEvent[] {
  return eventCalendar.filter((e) => e.months.includes(month));
}
