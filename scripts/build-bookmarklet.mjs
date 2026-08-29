#!/usr/bin/env node
/**
 * scripts/collect-titles-mobile.js から、ブックマークの URL 欄に貼れる
 * `javascript:` 形式の文字列を作る。
 *
 *   node scripts/build-bookmarklet.mjs
 *
 * 出力先: scripts/collect-titles-bookmarklet.txt
 *
 * 圧縮はせず、行頭コメントとインデントだけを落とす。
 * 文字列や正規表現リテラルの中身には触らないので壊れない。
 */
import { readFile, writeFile } from 'node:fs/promises';

const SRC = new URL('./collect-titles-mobile.js', import.meta.url);
const OUT = new URL('./collect-titles-bookmarklet.txt', import.meta.url);

const stripComments = (source) => {
  const out = [];
  let inBlock = false;
  for (const rawLine of source.split('\n')) {
    const line = rawLine.trim();
    if (inBlock) {
      if (line.includes('*/')) inBlock = false;
      continue;
    }
    if (line.startsWith('/*')) {
      if (!line.includes('*/')) inBlock = true;
      continue;
    }
    if (line.startsWith('//') || line === '') continue;
    out.push(line);
  }
  return out.join('\n');
};

const source = await readFile(SRC, 'utf8');
const code = stripComments(source);
const bookmarklet = `javascript:${encodeURIComponent(code)}`;

await writeFile(OUT, `${bookmarklet}\n`);
process.stderr.write(`書き出した: ${OUT.pathname}\n`);
process.stderr.write(`長さ: ${bookmarklet.length} 文字（元コード ${code.length} 文字）\n`);
