import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  aggregate, dedupe, detectCars, extractItems, guessCodes, normalizeSpaced, normalizeTight,
} from './extract.mjs';

const names = (title) => detectCars(title).map((h) => h.car.name).sort();
const codesOf = (title, name) => (detectCars(title).find((h) => h.car.name === name)?.codes ?? []).sort();

test('全角・区切り記号を吸収して車種名を拾う', () => {
  assert.equal(normalizeSpaced('Ｎ－ＢＯＸ　カスタム'), 'N BOX カスタム');
  assert.equal(normalizeTight('N-BOX'), 'NBOX');
  assert.deepEqual(names('NBOX カスタム パーツ'), ['N-BOX']);
  assert.deepEqual(names('Ｎ－ＢＯＸ　カスタム　フロアマット'), ['N-BOX']);
});

test('空白区切り・スラッシュ区切りの型式を個別に拾う', () => {
  assert.deepEqual(codesOf('N-BOX JF3 JF4 カスタム', 'N-BOX'), ['JF3', 'JF4']);
  assert.deepEqual(codesOf('ホンダ フィット GK3/GK5 カスタム', 'フィット'), ['GK3', 'GK5']);
  assert.deepEqual(codesOf('ハイエース 200系 TRH200V カスタム', 'ハイエース'), ['200系', 'TRH200V']);
});

test('一般語との衝突を避ける', () => {
  // 「ドアミラー」の中の「ミラ」
  assert.deepEqual(names('アルファード 30系 カスタム ドアミラーガーニッシュ'), ['アルファード']);
  // 「フィットする」「フィットネス」
  assert.deepEqual(names('車 シートカバー にフィットする 汎用 カスタム'), []);
  assert.deepEqual(names('フィットネス グッズ 車載 カスタム ホンダ'), []);
  // 「ダイキャスト」の中の「キャスト」
  assert.deepEqual(names('アルミダイキャスト製 トヨタ ホイールナット カスタム'), []);
  // 「ノートパソコン」の中の「ノート」
  assert.deepEqual(names('ノートパソコン 車載ホルダー 日産 カスタム'), []);
  // 「ゴルフボール」の中の「ゴルフ」
  assert.deepEqual(names('ゴルフボール 収納 車 カスタム トヨタ'), []);
});

test('誤検出しやすい車種はメーカー名か型式が必要', () => {
  assert.deepEqual(names('ノート 用 カスタム パーツ'), []);
  assert.deepEqual(names('日産 ノート E13 カスタム'), ['ノート']);
});

test('包含関係のある車種は具体的な方だけを数える', () => {
  assert.deepEqual(names('ジムニーシエラ JB74W 専用 カスタム'), ['ジムニーシエラ']);
  assert.deepEqual(names('ムーヴキャンバス LA800S カスタム'), ['ムーヴキャンバス']);
  assert.deepEqual(names('ランドクルーザープラド 150系 カスタム'), ['ランドクルーザープラド']);
  // 両方が独立して書かれている場合は両方数える
  assert.deepEqual(names('ジムニー JB64W / ジムニーシエラ JB74W カスタム'), ['ジムニー', 'ジムニーシエラ']);
});

test('バルブ規格などは型式候補から除外する', () => {
  assert.deepEqual(guessCodes('LEDテールランプ H4 12V T10 S25 カスタム'), []);
  assert.deepEqual(guessCodes('N-BOX JF3 JF4 カスタム H4 12V'), ['JF3', 'JF4']);
});

test('埋め込み JSON から商品を取り出し PR を判別する', () => {
  const state = {
    search: {
      result: { items: [{ itemName: 'ハイエース 200系 カスタム エアロ', itemCode: 'a:1', itemUrl: 'u1' }] },
      adArea: { items: [{ itemName: '【PR】車 カスタム ステッカー', itemCode: 'a:2', itemUrl: 'u2' }] },
    },
  };
  const html = `<html><script>window.__INITIAL_STATE__ = ${JSON.stringify(state)};</script></html>`;
  const { items, strategy } = extractItems(html);
  assert.equal(strategy, 'json(weak)');
  assert.equal(items.length, 2);
  assert.equal(items.filter((i) => i.isAd).length, 1);
  assert.equal(items.find((i) => !i.isAd).title, 'ハイエース 200系 カスタム エアロ');
});

test('DOM フォールバックで PR バッジ付きを除外する', () => {
  const html = '<html><body>'
    + '<div class="searchresultitem"><span class="badge">PR</span>'
    + '<h2><a href="https://item.rakuten.co.jp/s/ad">広告 車 カスタム マット</a></h2></div>'
    + '<div class="searchresultitem">'
    + '<h2><a href="https://item.rakuten.co.jp/s/1">タント LA650S <b>カスタム</b> フロアマット</a></h2></div>'
    + '</body></html>';
  const { items, strategy } = extractItems(html);
  assert.equal(strategy, 'dom');
  assert.deepEqual(items.map((i) => i.isAd), [true, false]);
  assert.equal(items[1].title, 'タント LA650S カスタム フロアマット');
});

test('重複タイトルと重複 ID を落とす', () => {
  const items = [
    { title: 'ハイエース 200系 カスタム', id: 'a:1' },
    { title: 'ハイエース　200系　カスタム', id: 'a:2' },
    { title: 'タント LA650S カスタム', id: 'a:1' },
    { title: 'タント LA650S カスタム', id: 'a:3' },
  ];
  assert.deepEqual(dedupe(items).map((i) => i.id), ['a:1', 'a:3']);
});

test('集計は件数順、型式も件数順に並ぶ', () => {
  const models = aggregate([
    'ハイエース 200系 カスタム エアロ',
    'ハイエース 200系 TRH200V カスタム シートカバー',
    'アルファード 30系 カスタム',
  ]);
  assert.equal(models[0].name, 'ハイエース');
  assert.equal(models[0].count, 2);
  assert.deepEqual(models[0].codes, [{ code: '200系', count: 2 }, { code: 'TRH200V', count: 1 }]);
  assert.equal(models[1].name, 'アルファード');
});
