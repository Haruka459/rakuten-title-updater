"use client";

import { useRef, useState } from "react";
import { parseProductsCsv } from "@/lib/csv";
import { productsStore } from "@/lib/appStores";
import Card from "@/components/ui/Card";

const EXPECTED_HEADER =
  "商品管理番号, 商品名, 価格, 売上, 販売個数, アクセス数, レビュー数, レビュー平均, 登録日, 前期売上";

type Encoding = "UTF-8" | "Shift_JIS";

// CSV取込結果を productsStore に反映する。既存の商品一覧には追加する形で取り込む
// （置き換えではないため、取り込み直後にテーブルで不要な行を個別に削除できる）。
function ingest(text: string, setErrors: (e: string[]) => void, setLastCount: (n: number) => void) {
  const { products, errors } = parseProductsCsv(text);
  if (products.length > 0) {
    productsStore.update((prev) => [...prev, ...products]);
  }
  setErrors(errors);
  setLastCount(products.length);
}

export default function CsvImportPanel() {
  const [encoding, setEncoding] = useState<Encoding>("Shift_JIS");
  const [pasteText, setPasteText] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [lastCount, setLastCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      ingest(text, setErrors, setLastCount);
    };
    reader.readAsText(file, encoding);
    // 同じファイルを連続で選び直せるよう input をリセットする
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePasteImport = () => {
    if (!pasteText.trim()) return;
    ingest(pasteText, setErrors, setLastCount);
    setPasteText("");
  };

  return (
    <Card title="CSV取込" description="楽天RMSからダウンロードした商品CSVを読み込みます">
      <p className="text-sm text-[#52514e] dark:text-[#c3c2b7] mb-3">
        このツールはすべてブラウザ内で処理されます。読み込んだデータが外部サーバーに送信されることはありません。
      </p>

      <p className="text-xs text-[#52514e] dark:text-[#c3c2b7] mb-4">
        期待するヘッダ: <code className="break-all">{EXPECTED_HEADER}</code>
      </p>

      <div className="flex flex-wrap items-center gap-4 mb-3">
        <span className="text-sm font-medium">文字コード:</span>
        {(["Shift_JIS", "UTF-8"] as const).map((enc) => (
          <label key={enc} className="flex items-center gap-1.5 text-sm">
            <input
              type="radio"
              name="csv-encoding"
              checked={encoding === enc}
              onChange={() => setEncoding(enc)}
              className="accent-blue-600"
            />
            {enc === "Shift_JIS" ? "Shift_JIS（楽天RMS標準）" : "UTF-8"}
          </label>
        ))}
      </div>

      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-white file:font-medium hover:file:bg-blue-700 file:cursor-pointer"
        />
      </div>

      <details className="mb-2">
        <summary className="cursor-pointer text-sm text-blue-600 dark:text-blue-400">
          CSVテキストを直接貼り付ける
        </summary>
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={6}
            placeholder="商品管理番号,商品名,価格,..."
            className="w-full rounded-md border border-black/10 dark:border-white/20 bg-transparent px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handlePasteImport}
            disabled={!pasteText.trim()}
            className="self-start rounded-md bg-blue-600 px-4 py-2 text-sm text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:hover:bg-blue-600"
          >
            テキストから取込
          </button>
        </div>
      </details>

      {lastCount !== null && (
        <p className="mt-3 text-sm text-[#0ca30c]">{lastCount}件の商品を取り込みました。</p>
      )}

      {errors.length > 0 && (
        <div className="mt-3 rounded-md border border-[#d03b3b]/30 bg-[#d03b3b]/5 p-3">
          <p className="text-sm font-medium text-[#d03b3b] mb-1">
            読み込めなかった行があります（{errors.length}件）
          </p>
          <ul className="list-disc list-inside text-sm text-[#d03b3b] space-y-0.5">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
