"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 共通ナビゲーション項目。各ルートは docs/PLAN.md 2章の画面一覧に対応する。
const NAV_ITEMS = [
  { href: "/", label: "ダッシュボード" },
  { href: "/simulator", label: "シミュレーター" },
  { href: "/products", label: "商品分析" },
  { href: "/titles", label: "商品名最適化" },
  { href: "/actions", label: "施策プラン" },
  { href: "/calendar", label: "イベント" },
  { href: "/settings", label: "設定" },
] as const;

export default function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="w-full border-b border-black/10 dark:border-white/10 bg-white dark:bg-[#0a0a0a] sticky top-0 z-10">
      {/* モバイルでも崩れないよう横スクロール可能なタブ型ナビにする */}
      <div className="flex gap-1 overflow-x-auto px-2 sm:px-4">
        {NAV_ITEMS.map((item) => {
          // "/" は完全一致、それ以外は前方一致でサブルートもハイライトする
          const active =
            item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href) ?? false;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`whitespace-nowrap px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
                active
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
