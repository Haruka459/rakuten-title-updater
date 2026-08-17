// CSVパース/生成（RFC4180相当）。docs/PLAN.md 第8章準拠。

import { parseNumericInput } from "@/lib/format";
import type { ParsedProductsCsv, Product } from "@/types/rakuten";

// ダブルクォート・改行(\r\n / \n)・二重クォートエスケープに対応した CSV パーサ
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (ch === "\r") {
      if (text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
      i++;
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
      i++;
      continue;
    }
    field += ch;
    i++;
  }

  // 末尾の改行が無い場合の最終フィールド/行を回収する
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function needsQuote(s: string): boolean {
  return /[",\r\n]/.test(s);
}

// 必要なセルのみクォートしてCSV文字列を生成する
export function toCsv(rows: (string | number)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell);
          return needsQuote(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\r\n");
}

const PRODUCT_HEADER_NAMES = [
  "商品管理番号",
  "商品名",
  "価格",
  "売上",
  "販売個数",
  "アクセス数",
  "レビュー数",
  "レビュー平均",
  "登録日",
  "前期売上",
] as const;

function normalizeHeader(h: string): string {
  return h.replace(/\s+/g, "");
}

// 商品CSVをパースする。ヘッダは日本語ヘッダ名で照合し、列の順序には依存しない。
// 見つからない列は 0 / 空文字で埋める。パース失敗行は捨てずに errors に記録する。
export function parseProductsCsv(text: string): ParsedProductsCsv {
  const rows = parseCsv(text);
  const errors: string[] = [];
  if (rows.length === 0) return { products: [], errors };

  const headerRow = rows[0].map(normalizeHeader);
  const colIndex = (name: string) => headerRow.indexOf(name);
  const idx = Object.fromEntries(
    PRODUCT_HEADER_NAMES.map((name) => [name, colIndex(name)]),
  ) as Record<(typeof PRODUCT_HEADER_NAMES)[number], number>;

  const get = (row: string[], i: number): string => (i >= 0 && i < row.length ? row[i] : "");

  const products: Product[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 1 && row[0].trim() === "") continue; // 空行はスキップ

    const itemNumber = get(row, idx["商品管理番号"]).trim();
    const name = get(row, idx["商品名"]).trim();
    if (!itemNumber && !name) {
      errors.push(`${r + 1}行目: 商品管理番号と商品名が両方空のため読み込めませんでした`);
      continue;
    }

    const registeredRaw = get(row, idx["登録日"]).trim();
    const parsedDate = registeredRaw ? Date.parse(registeredRaw) : NaN;
    if (registeredRaw && Number.isNaN(parsedDate)) {
      errors.push(`${r + 1}行目: 登録日の形式が不正です（${registeredRaw}）`);
    }

    products.push({
      id: `${itemNumber || "item"}-${r}`,
      itemNumber,
      name,
      price: parseNumericInput(get(row, idx["価格"])),
      sales: parseNumericInput(get(row, idx["売上"])),
      units: parseNumericInput(get(row, idx["販売個数"])),
      sessions: parseNumericInput(get(row, idx["アクセス数"])),
      reviewCount: parseNumericInput(get(row, idx["レビュー数"])),
      reviewAverage: parseNumericInput(get(row, idx["レビュー平均"])),
      registeredAt: Number.isFinite(parsedDate) ? parsedDate : 0,
      prevSales: parseNumericInput(get(row, idx["前期売上"])),
    });
  }

  return { products, errors };
}
