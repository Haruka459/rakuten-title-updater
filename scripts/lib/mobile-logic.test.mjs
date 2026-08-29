import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as node from './extract.mjs';
import * as mobile from './mobile-logic.generated.mjs';

/**
 * ブックマークレット版の判定ロジックが、テスト済みの Node 版と
 * 同じ結果を返すことを確かめる。片方だけ直して食い違うのを防ぐ。
 */

const CORPUS = [
  'ハイエース 200系 標準ボディ フロントリップスポイラー カスタム TRH200V KDH200V',
  'アルファード 30系 AGH30W カスタム メッキ ドアミラーガーニッシュ',
  'ヴェルファイア 30系 カスタムパーツ LEDテールランプ H4 12V',
  'N-BOX JF3 JF4 カスタム インテリアパネル ホンダ',
  'NBOX カスタム パーツ 汎用',
  'Ｎ－ＢＯＸ　カスタム　フロアマット',
  'ジムニー JB64W JB74W カスタム リフトアップ スペーサー スズキ',
  'ジムニーシエラ JB74W 専用 カスタム',
  'ジムニー JB64W / ジムニーシエラ JB74W カスタム',
  'ムーヴキャンバス LA800S カスタム',
  'ランドクルーザープラド 150系 TRJ150W カスタム',
  'ランドクルーザー 200系 URJ202W カスタム',
  'プリウス 50系 ZVW50 ZVW51 カスタム エアロ',
  'タント LA650S LA660S ダイハツ カスタム フロアマット',
  '車 シートカバー にフィットする 汎用 カスタム',
  'フィットネス グッズ 車載 カスタム ホンダ',
  'ホンダ フィット GK3/GK5 カスタム マフラー',
  'アルミダイキャスト製 トヨタ ホイールナット カスタム',
  'ダイハツ キャスト LA250S アクティバ カスタム',
  'ノートパソコン 車載ホルダー 日産 カスタム',
  '日産 ノート E13 カスタム',
  'ノート 用 カスタム パーツ',
  'ゴルフボール 収納 車 カスタム トヨタ',
  'フォルクスワーゲン ゴルフ カスタム パーツ',
  'ダイハツ ミラ L275S カスタム',
  'ミライース LA350S カスタム',
  'セレナ C27 GC27 日産 カスタム エアロ',
  'デリカD:5 CV1W 三菱 カスタム',
  'スイフトスポーツ ZC33S スズキ カスタム マフラー',
  'ハイエース200系ワイドボディ カスタム ドアミラーカバー',
  '汎用 車 カスタム LEDテープライト 12V 5m T10 S25',
  'レクサスRX AGL20W カスタム',
  '86 ZN6 BRZ ZC6 カスタム',
  'エブリイ DA17V スズキ カスタム 荷室ボード',
];

const shape = (impl, title) => impl.detectCars(title)
  .map((h) => `${h.car.name}[${[...h.codes].sort().join(',')}]`)
  .sort();

test('detectCars が Node 版と一致する', () => {
  for (const title of CORPUS) {
    assert.deepEqual(shape(mobile, title), shape(node, title), `不一致: ${title}`);
  }
});

test('guessCodes が Node 版と一致する', () => {
  for (const title of CORPUS) {
    assert.deepEqual(
      [...mobile.guessCodes(title)].sort(),
      [...node.guessCodes(title)].sort(),
      `不一致: ${title}`,
    );
  }
});

test('aggregate のランキングが Node 版と一致する', () => {
  const strip = (models) => models.map((m) => ({
    name: m.name, maker: m.maker, count: m.count, codes: m.codes, guessedCodes: m.guessedCodes,
  }));
  assert.deepEqual(strip(mobile.aggregate(CORPUS)), strip(node.aggregate(CORPUS)));
});

test('正規化が Node 版と一致する', () => {
  for (const title of CORPUS) {
    assert.equal(mobile.normSpaced(title), node.normalizeSpaced(title));
    assert.equal(mobile.normTight(title), node.normalizeTight(title));
  }
});

test('辞書がすべて取り込まれている', async () => {
  const { CARS } = await import('./car-dictionary.mjs');
  assert.equal(mobile.CARS.length, CARS.length);
  assert.deepEqual(mobile.CARS.map((c) => c.name), CARS.map((c) => c.name));
  for (let i = 0; i < CARS.length; i += 1) {
    assert.deepEqual(mobile.CARS[i].codes, CARS[i].codes, `型式が欠けている: ${CARS[i].name}`);
    assert.equal(mobile.CARS[i].strict === true, CARS[i].strict === true, `strict 不一致: ${CARS[i].name}`);
  }
});
