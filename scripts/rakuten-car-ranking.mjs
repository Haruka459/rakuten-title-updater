#!/usr/bin/env node
/**
 * 楽天市場の検索結果から商品タイトルを集め、
 * 「よく使われている車種名ランキング」と「車種ごとの型式ランキング」を作る。
 *
 *   # ネットに出られる環境で、検索ページから直接集計する
 *   node scripts/rakuten-car-ranking.mjs --keyword "車　カスタム" --limit 100
 *
 *   # 保存済みの検索結果 HTML から集計する（オフライン）
 *   node scripts/rakuten-car-ranking.mjs --html page1.html page2.html page3.html
 *
 *   # タイトルを1行1件で書いたテキストから集計する（オフライン）
 *   node scripts/rakuten-car-ranking.mjs --titles titles.txt
 *
 * 主なオプション:
 *   --limit N       集計対象の商品数（既定 100、PR除外後の件数）
 *   --top N         車種ランキングの表示件数（既定 50）
 *   --include-pr    PR（広告）枠も集計に含める
 *   --out-md PATH   Markdown レポートの出力先（既定 reports/<keyword>.md）
 *   --out-json PATH JSON の出力先
 *   --save-html DIR 取得した HTML を保存する
 *
 * 注意: Node の fetch はプロキシ環境変数を既定では読まない。
 * プロキシ配下では NODE_USE_ENV_PROXY=1 を付けて実行すること。
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { aggregate, dedupe, detectCars, extractItems } from './lib/extract.mjs';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const ITEMS_PER_PAGE = 45;

// ---------------------------------------------------------------- 引数

function parseArgs(argv) {
  const opts = {
    keyword: '車　カスタム',
    limit: 100,
    top: 50,
    includePr: false,
    html: [],
    titles: null,
    outMd: null,
    outJson: null,
    saveHtml: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => argv[(i += 1)];
    switch (arg) {
      case '--keyword': opts.keyword = next(); break;
      case '--limit': opts.limit = Number(next()); break;
      case '--top': opts.top = Number(next()); break;
      case '--include-pr': opts.includePr = true; break;
      case '--titles': opts.titles = next(); break;
      case '--out-md': opts.outMd = next(); break;
      case '--out-json': opts.outJson = next(); break;
      case '--save-html': opts.saveHtml = next(); break;
      case '--html':
        while (i + 1 < argv.length && !argv[i + 1].startsWith('--')) opts.html.push(argv[(i += 1)]);
        break;
      case '--help': case '-h': opts.help = true; break;
      default:
        throw new Error(`不明なオプション: ${arg}`);
    }
  }
  return opts;
}

// ---------------------------------------------------------------- 取得

const sleep = (ms) => new Promise((r) => { setTimeout(r, ms); });

function searchUrl(keyword, page) {
  const base = `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(keyword)}/`;
  return page > 1 ? `${base}?p=${page}` : base;
}

async function fetchPage(url, attempt = 1) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        'Accept-Language': 'ja,en;q=0.8',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    if (attempt >= 4) throw new Error(`${url} の取得に失敗: ${err.message}`);
    await sleep(2000 * 2 ** (attempt - 1));
    return fetchPage(url, attempt + 1);
  }
}

async function collectFromWeb(opts) {
  const pages = Math.max(1, Math.ceil(opts.limit / ITEMS_PER_PAGE));
  const all = [];
  const strategies = [];

  for (let page = 1; page <= pages; page += 1) {
    const url = searchUrl(opts.keyword, page);
    process.stderr.write(`取得中: ${url}\n`);
    const html = await fetchPage(url);
    if (opts.saveHtml) {
      await mkdir(opts.saveHtml, { recursive: true });
      await writeFile(join(opts.saveHtml, `page${page}.html`), html);
    }
    const { items, strategy } = extractItems(html);
    strategies.push(`p${page}:${strategy}(${items.length})`);
    all.push(...items);
    if (page < pages) await sleep(1500);
  }
  return { items: all, note: strategies.join(' ') };
}

async function collectFromHtmlFiles(paths) {
  const all = [];
  const strategies = [];
  for (const path of paths) {
    const html = await readFile(path, 'utf8');
    const { items, strategy } = extractItems(html);
    strategies.push(`${path}:${strategy}(${items.length})`);
    all.push(...items);
  }
  return { items: all, note: strategies.join(' ') };
}

async function collectFromTitleFile(path) {
  const text = await readFile(path, 'utf8');
  const items = text.split('\n')
    .map((line) => line.replace(/^\s*\d+[.)、:：]\s*/, '').trim())
    .filter((line) => line.length > 0)
    .map((title) => ({ title, id: '', isAd: false, source: 'titles' }));
  return { items, note: `${path}(${items.length})` };
}

// ---------------------------------------------------------------- 出力

function renderMarkdown({ keyword, models, titles, stats, top }) {
  const lines = [];
  lines.push(`# 楽天市場「${keyword}」タイトル分析`);
  lines.push('');
  lines.push(`- 集計日時: ${new Date().toISOString()}`);
  lines.push(`- 集計対象: ${titles.length} 件（PR除外 ${stats.adCount} 件 / 重複除去 ${stats.dupCount} 件）`);
  lines.push(`- 車種名が判定できたタイトル: ${stats.matchedTitles} 件`);
  lines.push(`- 抽出方法: ${stats.note}`);
  lines.push('');

  lines.push(`## 車種名ランキング TOP${top}`);
  lines.push('');
  lines.push('| 順位 | 車種 | メーカー | 件数 | 主な型式（多い順） |');
  lines.push('| ---: | --- | --- | ---: | --- |');
  models.slice(0, top).forEach((m, i) => {
    const codes = m.codes.slice(0, 5).map((c) => `${c.code}(${c.count})`).join(' / ') || '—';
    lines.push(`| ${i + 1} | ${m.name} | ${m.maker} | ${m.count} | ${codes} |`);
  });
  lines.push('');

  lines.push('## 車種別 型式ランキング');
  lines.push('');
  models.slice(0, top).forEach((m, i) => {
    lines.push(`### ${i + 1}. ${m.name}（${m.maker}） — ${m.count} 件`);
    lines.push('');
    if (m.codes.length === 0 && m.guessedCodes.length === 0) {
      lines.push('型式の記載なし。');
      lines.push('');
      return;
    }
    if (m.codes.length > 0) {
      lines.push('| 型式 | 件数 |');
      lines.push('| --- | ---: |');
      for (const c of m.codes) lines.push(`| ${c.code} | ${c.count} |`);
      lines.push('');
    }
    if (m.guessedCodes.length > 0) {
      const guessed = m.guessedCodes.slice(0, 10).map((c) => `${c.code}(${c.count})`).join(' / ');
      lines.push(`辞書外の型式候補（推定・要確認）: ${guessed}`);
      lines.push('');
    }
  });

  lines.push('## 集計に使ったタイトル');
  lines.push('');
  titles.forEach((t, i) => lines.push(`${i + 1}. ${t}`));
  lines.push('');
  return lines.join('\n');
}

// ---------------------------------------------------------------- main

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    process.stdout.write(`${await readFile(new URL(import.meta.url)).then((b) => b.toString().split('*/')[0])}*/\n`);
    return;
  }

  let collected;
  if (opts.titles) collected = await collectFromTitleFile(opts.titles);
  else if (opts.html.length > 0) collected = await collectFromHtmlFiles(opts.html);
  else collected = await collectFromWeb(opts);

  const raw = collected.items;
  const kept = opts.includePr ? raw : raw.filter((i) => !i.isAd);
  const adCount = raw.length - kept.length;
  const unique = dedupe(kept);
  const dupCount = kept.length - unique.length;
  const titles = unique.slice(0, opts.limit).map((i) => i.title);

  if (titles.length === 0) {
    throw new Error(
      '商品タイトルを1件も抽出できなかった。楽天のページ構造が変わった可能性がある。'
      + ' --save-html で HTML を保存して確認するか、--titles でタイトルを直接渡すこと。',
    );
  }
  if (titles.length < opts.limit) {
    process.stderr.write(`警告: ${opts.limit} 件の指定に対し ${titles.length} 件しか集まらなかった\n`);
  }

  const models = aggregate(titles);
  const matchedTitles = titles.filter((t) => detectCars(t).length > 0).length;
  const stats = { adCount, dupCount, matchedTitles, note: collected.note };

  const md = renderMarkdown({ keyword: opts.keyword, models, titles, stats, top: opts.top });
  const mdPath = opts.outMd ?? join('reports', `${opts.keyword.replace(/[\s　/]+/g, '_')}.md`);
  await mkdir(dirname(mdPath), { recursive: true });
  await writeFile(mdPath, md);
  process.stderr.write(`Markdown を書き出した: ${mdPath}\n`);

  if (opts.outJson) {
    await mkdir(dirname(opts.outJson), { recursive: true });
    await writeFile(opts.outJson, `${JSON.stringify({ keyword: opts.keyword, stats, models, titles }, null, 2)}\n`);
    process.stderr.write(`JSON を書き出した: ${opts.outJson}\n`);
  }

  // 標準出力には要約だけ
  process.stdout.write(`対象 ${titles.length} 件 / 車種 ${models.length} 種類\n\n`);
  models.slice(0, opts.top).forEach((m, i) => {
    const codes = m.codes.slice(0, 3).map((c) => `${c.code}(${c.count})`).join(' ') || '-';
    process.stdout.write(`${String(i + 1).padStart(3)}. ${m.name.padEnd(16)} ${String(m.count).padStart(3)}件  ${codes}\n`);
  });
}

main().catch((err) => {
  process.stderr.write(`エラー: ${err.message}\n`);
  process.exitCode = 1;
});
