// localStorage 汎用ストア。module-level state + listeners Set と、
// useSyncExternalStore 用の subscribe/getSnapshot/getServerSnapshot を
// createStore<T>() で汎用化したもの。

export type Store<T> = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  set: (value: T) => void;
  update: (updater: (prev: T) => T) => void;
  reset: () => void;
};

export function createStore<T>(key: string, initial: T): Store<T> {
  let state: T = initial;
  let hydrated = false;
  const listeners = new Set<() => void>();

  function readFromStorage(): T {
    try {
      if (typeof window === "undefined") return initial;
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  }

  function ensureHydrated() {
    if (!hydrated) {
      state = readFromStorage();
      hydrated = true;
    }
  }

  function persistAndEmit(next: T) {
    state = next;
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(state));
      }
    } catch {
      // localStorage が使えない環境では保存をスキップする
    }
    listeners.forEach((listener) => listener());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function getSnapshot(): T {
    ensureHydrated();
    return state;
  }

  function getServerSnapshot(): T {
    return initial;
  }

  function set(value: T) {
    ensureHydrated();
    persistAndEmit(value);
  }

  function update(updater: (prev: T) => T) {
    ensureHydrated();
    persistAndEmit(updater(state));
  }

  function reset() {
    hydrated = true;
    persistAndEmit(initial);
  }

  return { subscribe, getSnapshot, getServerSnapshot, set, update, reset };
}
