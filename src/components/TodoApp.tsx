"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import type { Filter } from "@/types/todo";
import {
  addTodo,
  clearCompleted,
  deleteTodo,
  getServerSnapshot,
  getSnapshot,
  subscribe,
  toggleTodo,
} from "@/lib/todoStore";

export default function TodoApp() {
  const todos = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [text, setText] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    addTodo(trimmed);
    setText("");
  };

  const filteredTodos = useMemo(() => {
    switch (filter) {
      case "active":
        return todos.filter((todo) => !todo.completed);
      case "completed":
        return todos.filter((todo) => todo.completed);
      default:
        return todos;
    }
  }, [todos, filter]);

  const remainingCount = todos.filter((todo) => !todo.completed).length;

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">ToDo リスト</h1>

      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="新しいタスクを入力"
          className="flex-1 rounded-md border border-black/10 dark:border-white/20 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          追加
        </button>
      </form>

      <div className="flex justify-center gap-2 mb-4 text-sm">
        {(["all", "active", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full transition-colors ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
            }`}
          >
            {f === "all" ? "すべて" : f === "active" ? "未完了" : "完了済み"}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-2">
        {filteredTodos.length === 0 && (
          <li className="text-center text-sm text-black/40 dark:text-white/40 py-6">
            タスクはありません
          </li>
        )}
        {filteredTodos.map((todo) => (
          <li
            key={todo.id}
            className="flex items-center gap-3 rounded-md border border-black/10 dark:border-white/10 px-3 py-2"
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
              className="size-4 accent-blue-600"
            />
            <span
              className={`flex-1 break-words ${
                todo.completed ? "line-through text-black/40 dark:text-white/40" : ""
              }`}
            >
              {todo.text}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              aria-label="削除"
              className="text-black/40 hover:text-red-600 dark:text-white/40 dark:hover:text-red-400 transition-colors"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {todos.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-black/60 dark:text-white/60">
          <span>残り {remainingCount} 件</span>
          <button
            onClick={clearCompleted}
            className="hover:underline disabled:opacity-40 disabled:hover:no-underline"
            disabled={remainingCount === todos.length}
          >
            完了済みを削除
          </button>
        </div>
      )}
    </div>
  );
}
