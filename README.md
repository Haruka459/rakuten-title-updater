This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 楽天検索タイトルの車種／型式ランキング

`scripts/rakuten-car-ranking.mjs` は、楽天市場の検索結果から商品タイトルを集めて
「よく使われている車種名ランキング」と「車種ごとの型式ランキング」を作る CLI です。
PR（広告）枠は既定で除外します。

```bash
# 検索ページから直接集計する（要ネットワーク）
npm run rank -- --keyword "車　カスタム" --limit 100 --top 50

# 保存済みの検索結果 HTML から集計する（オフライン）
npm run rank -- --html page1.html page2.html page3.html

# タイトルを1行1件で書いたテキストから集計する（オフライン）
npm run rank -- --titles titles.txt
```

主なオプション:

| オプション | 意味 |
| --- | --- |
| `--keyword` | 検索キーワード（既定 `車　カスタム`） |
| `--limit N` | 集計する商品数。PR 除外・重複除去のあとの件数（既定 100） |
| `--top N` | 車種ランキングの表示件数（既定 50） |
| `--include-pr` | PR 枠も集計に含める |
| `--out-md PATH` | Markdown レポートの出力先（既定 `reports/<keyword>.md`） |
| `--out-json PATH` | JSON の出力先 |
| `--save-html DIR` | 取得した HTML を保存する |

出力される Markdown には、車種ランキング表、車種別の型式ランキング、
そして集計に使ったタイトル一覧が入ります。

### タイトルだけ手早く集める（ブラウザのコンソール）

Node を用意せずにタイトルだけ集めたい場合は `scripts/collect-titles-in-browser.js` を使います。

1. 楽天の検索結果ページを開く
2. 開発者ツールの Console タブを開く（Windows: F12 / Mac: Cmd+Option+I）
3. ファイルの中身をまるごと貼り付けて Enter

PR（広告）を除いたタイトルが最大100件、クリップボードにコピーされます。
そのまま `titles.txt` に保存して `npm run rank -- --titles titles.txt` に渡せます。

ページ送りの数や件数は、ファイル冒頭の `CONFIG` で変えられます。

### 仕組みと注意点

- 商品の取り出しは、ページに埋め込まれた JSON を優先し、失敗したら DOM 解析に落とします。
  どちらを使ったかはレポートの「抽出方法」欄に出ます。1 件も取れない場合はエラーになるので、
  `--save-html` で HTML を保存して構造を確認してください。
- 車種名と型式の辞書は `scripts/lib/car-dictionary.mjs` にあります。取りこぼしがあれば
  ここに追記してください。`notPartOf` は「ドアミラー」の中の「ミラ」のような
  誤検出を防ぐためのものです。
- 辞書に無い型式は「辞書外の型式候補（推定）」として別枠に出ます。そのまま鵜呑みにせず確認してください。
- Node の `fetch` は既定でプロキシ環境変数を読みません。プロキシ配下では
  `NODE_USE_ENV_PROXY=1 npm run rank` のように実行してください。

判定ロジックのテスト:

```bash
npm run test:extract
```
