#!/usr/bin/env node
/**
 * scripts/collect-and-rank-mobile.js のテンプレートに車種辞書を埋め込み、
 * ブックマークの URL 欄に貼れる `javascript:` 形式を生成する。
 *
 *   node scripts/build-mobile-ranking.mjs
 *
 * 出力先: scripts/rank-bookmarklet.txt
 *
 * 日本語はパーセントエンコードせず生のまま残す。
 * エンコードすると1文字9文字に膨らみ、ブックマークに収まらなくなるため。
 */
import { readFile, writeFile } from 'node:fs/promises';
import { CARS, MAKERS } from './lib/car-dictionary.mjs';

const SRC = new URL('./collect-and-rank-mobile.js', import.meta.url);
const OUT = new URL('./rank-bookmarklet.txt', import.meta.url);
// 判定ロジックだけを切り出した検証用モジュール。テストはこれを読む
const OUT_LOGIC = new URL('./lib/mobile-logic.generated.mjs', import.meta.url);
const LOGIC_START = '/* --- LOGIC START --- */';
const LOGIC_END = '/* --- LOGIC END --- */';

// 辞書を「name|maker|別名|型式|除外語|strict」を ~ で連結した1本の文字列に畳む
const RESERVED = /[~|,']/;
const check = (value, where) => {
  if (RESERVED.test(value)) throw new Error(`区切り文字が使えない値: ${value} (${where})`);
  return value;
};

const dict = CARS.map((car) => {
  const aliases = car.aliases.filter((a) => a !== car.name);
  return [
    check(car.name, 'name'),
    check(car.maker, 'maker'),
    aliases.map((a) => check(a, 'alias')).join(','),
    car.codes.map((c) => check(c, 'code')).join(','),
    (car.notPartOf ?? []).map((w) => check(w, 'notPartOf')).join(','),
    car.strict ? '1' : '',
  ].join('|');
}).join('~');

const makers = MAKERS.map((m) => check(m, 'maker')).join(',');

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

const template = await readFile(SRC, 'utf8');
if (!template.includes('__DICT__') || !template.includes('__MAKERS__')) {
  throw new Error('テンプレートに __DICT__ / __MAKERS__ が見つからない');
}

const inject = (text) => text.replace('__MAKERS__', makers).replace('__DICT__', dict);

const code = inject(stripComments(template));

// テンプレートの判定ロジック部分を、そのままインポートできる形で書き出す
const from = template.indexOf(LOGIC_START);
const to = template.indexOf(LOGIC_END);
if (from === -1 || to === -1) throw new Error('LOGIC マーカーが見つからない');
const logic = inject(template.slice(from + LOGIC_START.length, to)).trim();

await writeFile(OUT_LOGIC, [
  '// 自動生成。編集しないこと。',
  '// 生成元: scripts/collect-and-rank-mobile.js + scripts/lib/car-dictionary.mjs',
  '// 生成方法: node scripts/build-mobile-ranking.mjs',
  '',
  logic,
  '',
  'export { CARS, detectCars, aggregate, guessCodes, normSpaced, normTight };',
  '',
].join('\n'));

// URL として壊れる文字だけを退避し、マルチバイト文字は生のまま戻す。
// ただし全角スペースなど「空白に見える非ASCII」は、URL 中で落とされうるので戻さない。
const INVISIBLE = /[\u00A0\u1680\u2000-\u200B\u2028\u2029\u202F\u205F\u3000\uFEFF]/g;
const body = encodeURIComponent(code)
  .replace(/(?:%[89A-F][0-9A-F])+/gi, (m) => decodeURIComponent(m))
  .replace(INVISIBLE, (ch) => encodeURIComponent(ch));
const bookmarklet = `javascript:${body}`;

await writeFile(OUT, `${bookmarklet}\n`);
process.stderr.write(`書き出した: ${OUT.pathname}\n`);
process.stderr.write(`書き出した: ${OUT_LOGIC.pathname}\n`);
process.stderr.write(`車種 ${CARS.length} 件 / 辞書 ${dict.length} 文字\n`);
process.stderr.write(`コード ${code.length} 文字 → ブックマークレット ${bookmarklet.length} 文字\n`);
