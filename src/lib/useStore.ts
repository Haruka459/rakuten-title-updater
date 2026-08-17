"use client";

import { useSyncExternalStore } from "react";
import type { Store } from "@/lib/store";

// localStorage ストアを購読する共通フック。
// SSR時は getServerSnapshot が不変の初期値を返すため、
// ハイドレーション不整合を起こさない。
export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}
