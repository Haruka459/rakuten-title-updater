"use client";

import { useEffect, useState } from "react";
import EventChecklist from "@/components/calendar/EventChecklist";
import { EVENT_CALENDAR_DISCLAIMER, eventCalendar, eventsForMonth } from "@/lib/eventCalendar";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function CalendarPage() {
  // useState の初期化関数はサーバー側のレンダリングでも実行されるため、
  // ここで new Date() を呼ぶとサーバーとブラウザで月がずれてハイドレーション不整合になる。
  // 初期値は null にしておき、マウント後に今月を設定する。
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  useEffect(() => {
    setSelectedMonth(new Date().getMonth() + 1);
  }, []);

  const monthlyEvents = selectedMonth === null ? [] : eventsForMonth(selectedMonth);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
      <h1 className="text-2xl font-bold">年間イベント対策</h1>

      <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200 px-4 py-3 text-sm font-medium">
        {EVENT_CALENDAR_DISCLAIMER}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">月別ビュー</h2>
        <div className="flex flex-wrap gap-1">
          {MONTHS.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedMonth === m
                  ? "bg-blue-600 text-white"
                  : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
              }`}
            >
              {m}月
            </button>
          ))}
        </div>

        {selectedMonth === null ? (
          <p className="text-sm text-black/40 dark:text-white/40 py-6 text-center">
            読み込み中...
          </p>
        ) : monthlyEvents.length === 0 ? (
          <p className="text-sm text-black/40 dark:text-white/40 py-6 text-center">
            この月に予定されているイベントはありません。
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {monthlyEvents.map((event) => (
              <EventChecklist key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">年間一覧</h2>
        <p className="text-xs text-[#52514e] dark:text-[#c3c2b7]">{EVENT_CALENDAR_DISCLAIMER}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {eventCalendar.map((event) => (
            <EventChecklist key={event.id} event={event} showMonths />
          ))}
        </div>
      </section>
    </div>
  );
}
