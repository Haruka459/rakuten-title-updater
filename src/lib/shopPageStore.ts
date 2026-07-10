import type { ProductCard } from "@/types/shopPage";

const STORAGE_KEY = "rakuten-page:cards";

const DEFAULT_CARDS: ProductCard[] = [
  { id: "large-1", size: "large", imageUrl: "", linkUrl: "", title: "大画像バナー 1", description: "" },
  { id: "large-2", size: "large", imageUrl: "", linkUrl: "", title: "大画像バナー 2", description: "" },
  { id: "small-1", size: "small", imageUrl: "", linkUrl: "", title: "商品 1", description: "" },
  { id: "small-2", size: "small", imageUrl: "", linkUrl: "", title: "商品 2", description: "" },
  { id: "small-3", size: "small", imageUrl: "", linkUrl: "", title: "商品 3", description: "" },
  { id: "small-4", size: "small", imageUrl: "", linkUrl: "", title: "商品 4", description: "" },
];

let cards: ProductCard[] = DEFAULT_CARDS;
let hydrated = false;
const listeners = new Set<() => void>();

function isProductCard(value: unknown): value is ProductCard {
  if (typeof value !== "object" || value === null) return false;
  const card = value as Record<string, unknown>;
  return (
    typeof card.id === "string" &&
    (card.size === "large" || card.size === "small") &&
    typeof card.imageUrl === "string" &&
    typeof card.linkUrl === "string" &&
    typeof card.title === "string" &&
    typeof card.description === "string"
  );
}

function readFromStorage(): ProductCard[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CARDS;
    const parsed = JSON.parse(raw) as unknown;
    if (
      Array.isArray(parsed) &&
      parsed.length === DEFAULT_CARDS.length &&
      parsed.every(isProductCard)
    ) {
      return parsed;
    }
    return DEFAULT_CARDS;
  } catch {
    return DEFAULT_CARDS;
  }
}

function ensureHydrated() {
  if (!hydrated) {
    cards = readFromStorage();
    hydrated = true;
  }
}

function persistAndEmit(next: ProductCard[]) {
  cards = next;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): ProductCard[] {
  ensureHydrated();
  return cards;
}

export function getServerSnapshot(): ProductCard[] {
  return DEFAULT_CARDS;
}

export function updateCard(
  id: string,
  patch: Partial<Omit<ProductCard, "id" | "size">>,
) {
  ensureHydrated();
  persistAndEmit(
    cards.map((card) => (card.id === id ? { ...card, ...patch } : card)),
  );
}

/**
 * 同じサイズ（同じ段）のカード同士で表示順を入れ替える。
 * 段をまたぐ移動は大小の枠サイズが合わないため許可しない。
 */
export function moveCard(id: string, direction: "prev" | "next") {
  ensureHydrated();
  const index = cards.findIndex((card) => card.id === id);
  if (index === -1) return;
  const target = index + (direction === "prev" ? -1 : 1);
  if (target < 0 || target >= cards.length) return;
  if (cards[target].size !== cards[index].size) return;
  const next = [...cards];
  [next[index], next[target]] = [next[target], next[index]];
  persistAndEmit(next);
}

export function resetCards() {
  ensureHydrated();
  persistAndEmit(DEFAULT_CARDS);
}
