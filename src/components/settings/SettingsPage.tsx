"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import { exportBackup, importBackup, resetAll } from "@/lib/appStores";

export default function SettingsPage() {
  const [importText, setImportText] = useState("");
  const [importMessage, setImportMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  // クリックイベント内なので new Date() を呼んでよい（レンダー中の呼び出しではない）
  const handleExport = () => {
    const backup = exportBackup();
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().slice(0, 10);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rakuten-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const runImport = (raw: string) => {
    const result = importBackup(raw);
    setImportMessage({ ok: result.ok, text: result.message });
    setResetDone(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      runImport(typeof reader.result === "string" ? reader.result : "");
    };
    reader.readAsText(file);
    // 同じファイルを連続選択してもonChangeが発火するようリセットする
    e.target.value = "";
  };

  const handleReset = () => {
    if (!confirmingReset) {
      setConfirmingReset(true);
      return;
    }
    resetAll();
    setConfirmingReset(false);
    setResetDone(true);
    setImportMessage(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-8">
      <h1 className="text-2xl font-bold">データ管理</h1>

      <Card title="エクスポート" description="現在のデータをJSONファイルとして書き出します。">
        <button
          onClick={handleExport}
          className="rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          JSONをダウンロード
        </button>
      </Card>

      <Card
        title="インポート"
        description="エクスポートしたJSONファイル、またはJSONテキストから復元します。"
      >
        <div className="flex flex-col gap-3">
          <input
            type="file"
            accept="application/json"
            onChange={handleFileChange}
            className="text-sm"
          />
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="JSONテキストを貼り付け"
            rows={6}
            className="rounded-md border border-black/10 dark:border-white/20 bg-transparent px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => runImport(importText)}
            disabled={!importText.trim()}
            className="self-start rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-40"
          >
            テキストから復元
          </button>
          {importMessage && (
            <p
              className={`text-sm font-medium ${
                importMessage.ok ? "text-[#0ca30c]" : "text-[#d03b3b]"
              }`}
            >
              {importMessage.ok ? "✓ " : "✕ "}
              {importMessage.text}
            </p>
          )}
        </div>
      </Card>

      <Card title="全データ削除" description="このブラウザに保存されたすべてのデータを削除します。">
        <div className="flex flex-col gap-3">
          {confirmingReset ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-[#d03b3b]">
                本当に削除しますか？この操作は取り消せません。
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="rounded-md bg-[#d03b3b] px-4 py-2 text-white font-medium hover:opacity-90 transition-opacity"
                >
                  はい、削除する
                </button>
                <button
                  onClick={() => setConfirmingReset(false)}
                  className="rounded-md bg-black/5 dark:bg-white/10 px-4 py-2 font-medium hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleReset}
              className="rounded-md border border-[#d03b3b] text-[#d03b3b] px-4 py-2 font-medium hover:bg-[#d03b3b]/10 transition-colors"
            >
              すべて削除する
            </button>
          )}
          {resetDone && !confirmingReset && (
            <p className="text-sm font-medium text-[#0ca30c]">
              ✓ すべてのデータを削除しました。
            </p>
          )}
        </div>
      </Card>

      <Card title="このツールについて">
        <ul className="list-disc list-inside text-sm text-[#52514e] dark:text-[#c3c2b7] flex flex-col gap-1.5">
          <li>
            データはすべてこのブラウザ内（localStorage）に保存され、外部に送信されることはありません。
          </li>
          <li>外部API・サーバー・有料サービスは一切使用していないため、追加費用は発生しません。</li>
          <li>
            ブラウザのデータを消去すると保存内容が失われます。定期的なJSONエクスポートを推奨します。
          </li>
          <li>楽天の有料オプション（CSV一括編集など）が無くても、すべての機能を利用できます。</li>
        </ul>
      </Card>
    </div>
  );
}
