import type { Todo } from "@/types/todo";

const STORAGE_KEY = "todo-app:todos";
const EMPTY_TODOS: Todo[] = [];

let todos: Todo[] = EMPTY_TODOS;
let hydrated = false;
const listeners = new Set<() => void>();

function readFromStorage(): Todo[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Todo[]) : EMPTY_TODOS;
  } catch {
    return EMPTY_TODOS;
  }
}

function ensureHydrated() {
  if (!hydrated) {
    todos = readFromStorage();
    hydrated = true;
  }
}

function persistAndEmit(next: Todo[]) {
  todos = next;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): Todo[] {
  ensureHydrated();
  return todos;
}

export function getServerSnapshot(): Todo[] {
  return EMPTY_TODOS;
}

export function addTodo(text: string) {
  ensureHydrated();
  persistAndEmit([
    { id: crypto.randomUUID(), text, completed: false, createdAt: Date.now() },
    ...todos,
  ]);
}

export function toggleTodo(id: string) {
  ensureHydrated();
  persistAndEmit(
    todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)),
  );
}

export function deleteTodo(id: string) {
  ensureHydrated();
  persistAndEmit(todos.filter((todo) => todo.id !== id));
}

export function clearCompleted() {
  ensureHydrated();
  persistAndEmit(todos.filter((todo) => !todo.completed));
}
