import {
  CARS, MAKERS, CODE_BLOCKLIST, SERIES_CODE_RE, ALNUM_CODE_RE,
} from './car-dictionary.mjs';

// ---------------------------------------------------------------- 文字列処理

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', yen: '¥',
};

export function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#([0-9]+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

export function stripTags(s) {
  return s.replace(/<[^>]*>/g, '');
}

export function cleanTitle(raw) {
  return decodeEntities(stripTags(String(raw)))
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 照合用の正規化（区切り文字を空白に畳む版）。
 * 全角→半角(NFKC)、大文字化、記号類を空白1つに。
 * 型式の語境界を保つため、空白は「消さずに残す」のが要点。
 * 長音符「ー」は車種名の一部なので残す。
 */
export function normalizeSpaced(s) {
  return String(s)
    .normalize('NFKC')
    .toUpperCase()
    .replace(/[\s　\-_/｜|･・、,，．.:：;；()（）[\]【】「」『』+＋]+/g, ' ')
    .trim();
}

/** 車種名照合用。区切りを完全に除去して「N-BOX」「N BOX」「NBOX」を同一視する */
export function normalizeTight(s) {
  return normalizeSpaced(s).replace(/ /g, '');
}

const HIRAGANA = /[ぁ-ゖ]/;
const KATAKANA_ONLY = /^[ァ-ヺー]+$/;

// ---------------------------------------------------------------- 車種の判定

const PREPARED = CARS.map((car) => ({
  ...car,
  preparedAliases: car.aliases.map((raw) => ({
    raw,
    spaced: normalizeSpaced(raw),
    tight: normalizeTight(raw),
    katakana: KATAKANA_ONLY.test(raw),
  })),
  normNotPartOf: (car.notPartOf ?? []).map((w) => normalizeSpaced(w)),
  normCodes: [...new Set(car.codes.map((c) => normalizeTight(c)))],
}));

const NORM_MAKERS = MAKERS.map((m) => normalizeTight(m));

function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  let n = 0;
  let from = 0;
  for (;;) {
    const i = haystack.indexOf(needle, from);
    if (i === -1) return n;
    n += 1;
    from = i + 1;
  }
}

/** [i, i+len) の範囲が word の出現範囲にすっぽり収まっているか */
function coveredBy(text, i, len, word) {
  let from = 0;
  for (;;) {
    const j = text.indexOf(word, from);
    if (j === -1) return false;
    if (j <= i && i + len <= j + word.length) return true;
    from = j + 1;
  }
}

/**
 * alias が「車種名として」現れる位置を返す。
 * カタカナ車種名は次の場合に車種名ではないとみなす:
 *   - 直後がひらがな（「フィットする」「ノートに」）
 *   - 直後が長音符（「ドアミラー」の中の「ミラ」）
 *   - notPartOf に挙げた語の一部（「ダイキャスト」の中の「キャスト」）
 */
function aliasOccurrences(text, alias, katakana, notPartOf) {
  const endsLong = alias.endsWith('ー');
  const found = [];
  let from = 0;
  for (;;) {
    const i = text.indexOf(alias, from);
    if (i === -1) return found;
    from = i + 1;
    const after = text[i + alias.length] ?? '';
    if (katakana && (HIRAGANA.test(after) || (!endsLong && after === 'ー'))) continue;
    if (notPartOf.some((w) => coveredBy(text, i, alias.length, w))) continue;
    found.push(i);
  }
}

/**
 * 型式コードが単語として現れるか。
 * 空白を残した `spaced` に対して見るので「JF3 JF4」が正しく2件に割れる。
 */
export function codeAppears(spaced, code) {
  if (code.endsWith('系')) {
    const i = spaced.indexOf(code);
    return i !== -1 && !/[0-9]/.test(spaced[i - 1] ?? '');
  }
  const re = new RegExp(`(?<![A-Z0-9])${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Z0-9])`);
  return re.test(spaced);
}

/**
 * 1つのタイトルから車種を検出する。戻り値: [{ car, codes: [型式...] }]
 * 「ジムニー」と「ジムニーシエラ」のような包含関係は、具体的な方だけを残す。
 */
export function detectCars(title) {
  const spaced = normalizeSpaced(title);
  const tight = normalizeTight(title);

  const hits = [];
  for (const car of PREPARED) {
    // 区切り記号ありの別名（N-BOX 等）は、記号を潰した表記でも拾えるようにする
    const matched = [];
    for (const alias of car.preparedAliases) {
      let count = aliasOccurrences(spaced, alias.spaced, alias.katakana, car.normNotPartOf).length;
      if (count === 0 && alias.tight !== alias.spaced) {
        count = aliasOccurrences(tight, alias.tight, alias.katakana, car.normNotPartOf).length;
      }
      if (count > 0) matched.push({ text: alias.tight, count });
    }
    if (matched.length === 0) continue;

    const codes = car.normCodes.filter((c) => codeAppears(spaced, c));

    if (car.strict) {
      // 誤検出しやすい車種名は、メーカー名か型式が同居している場合のみ採用
      const hasMaker = NORM_MAKERS.some((m) => tight.includes(m));
      if (!hasMaker && codes.length === 0) continue;
    }

    hits.push({ car, codes, matched });
  }

  // 包含関係の吸収: X のヒットが全て別車種のより長い別名の内側でしか起きていないなら X を捨てる
  const kept = hits.filter((x) => x.matched.some(({ text, count }) => {
    let inside = 0;
    for (const y of hits) {
      if (y === x) continue;
      for (const longer of y.matched) {
        if (longer.text === text || !longer.text.includes(text)) continue;
        inside += countOccurrences(tight, longer.text) * countOccurrences(longer.text, text);
      }
    }
    return count > inside; // 単独で現れている箇所がある
  }));

  return kept.map(({ car, codes }) => ({ car, codes }));
}

/** タイトルから辞書に無い型式候補を拾う（推定用） */
export function guessCodes(title) {
  const spaced = normalizeSpaced(title);
  const found = new Set();
  for (const m of spaced.matchAll(SERIES_CODE_RE)) found.add(`${m[1]}系`);
  for (const m of spaced.matchAll(ALNUM_CODE_RE)) {
    const code = m[1];
    if (code.length < 3) continue;
    if (CODE_BLOCKLIST.has(code)) continue;
    found.add(code);
  }
  return [...found];
}

// ---------------------------------------------------------------- HTML 解析

function scriptBlocks(html) {
  return [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
}

/** 文字列を意識しながら括弧の対応を取り、marker 以降の最初の JSON を切り出す */
function jsonAfter(text, marker) {
  const start = text.indexOf(marker);
  if (start === -1) return null;
  const open = text.indexOf('{', start + marker.length);
  if (open === -1) return null;

  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = open; i < text.length; i += 1) {
    const ch = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(open, i + 1);
    }
  }
  return null;
}

const TITLE_KEYS = ['itemName', 'itemTitle', 'productName', 'name', 'title'];
const ITEM_KEYS = ['itemUrl', 'itemCode', 'itemPrice', 'shopName', 'shopUrl', 'url', 'price', 'itemId'];
const AD_PATH_RE = /(^|[^a-z])(ad|ads|adarea|advertis|sponsor|promotion|pr)([^a-z]|$)/i;
const AD_FLAG_KEYS = ['isAd', 'isAds', 'ad', 'isSponsored', 'sponsored', 'adFlag', 'isPr', 'pr'];

/** JSON ツリーを歩いて商品らしきノードを集める */
function collectFromJson(node, path, out, seen) {
  if (node === null || typeof node !== 'object') return;
  if (seen.has(node)) return;
  seen.add(node);

  if (Array.isArray(node)) {
    for (const child of node) collectFromJson(child, path, out, seen);
    return;
  }

  const titleKey = TITLE_KEYS.find((k) => typeof node[k] === 'string' && node[k].trim().length > 8);
  const looksLikeItem = titleKey && ITEM_KEYS.some((k) => k in node);
  if (looksLikeItem) {
    const flagged = AD_FLAG_KEYS.some((k) => node[k] === true || node[k] === 1 || node[k] === 'true');
    const pathAd = path.some((seg) => AD_PATH_RE.test(seg));
    out.push({
      title: cleanTitle(node[titleKey]),
      id: String(node.itemCode ?? node.itemId ?? node.itemUrl ?? node.url ?? ''),
      isAd: flagged || pathAd,
      source: `json:${path.slice(-3).join('.')}`,
    });
  }

  for (const [key, value] of Object.entries(node)) {
    collectFromJson(value, [...path, key], out, seen);
  }
}

function extractFromJson(html) {
  const out = [];
  const seen = new WeakSet();
  for (const block of scriptBlocks(html)) {
    const text = block.trim();
    if (!text) continue;

    const candidates = [];
    for (const marker of ['__INITIAL_STATE__', '__PRELOADED_STATE__', '__NUXT__', '__NEXT_DATA__']) {
      const json = jsonAfter(text, marker);
      if (json) candidates.push(json);
    }
    if (candidates.length === 0 && text.startsWith('{')) candidates.push(text);

    for (const json of candidates) {
      try {
        collectFromJson(JSON.parse(json), [], out, seen);
      } catch {
        // JSON でなければ無視
      }
    }
  }
  return out;
}

/**
 * DOM ベースの抽出（JSON 抽出が空振りしたときのフォールバック）。
 * 商品ブロックらしき単位に切ってから、その中の商品リンクと PR バッジを見る。
 */
function extractFromDom(html) {
  const boundary = /<(?:div|li)\b[^>]*(?:class="[^"]*(?:searchresultitem|dui-card|searchresultitems-item)[^"]*"|data-testid="[^"]*(?:search-result|item-card)[^"]*")[^>]*>/gi;
  const starts = [...html.matchAll(boundary)].map((m) => m.index);
  const blocks = starts.length > 0
    ? starts.map((s, i) => html.slice(s, starts[i + 1] ?? html.length))
    : [html];

  const out = [];
  for (const block of blocks) {
    const link = block.match(/<a\b[^>]*href="(https?:\/\/item\.rakuten\.co\.jp\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!link) continue;
    const title = cleanTitle(link[2]);
    if (title.length < 8) continue;
    const isAd = />\s*PR\s*</i.test(block)
      || /class="[^"]*\b(ad|ads|sponsor)[a-z-]*\b[^"]*"/i.test(block)
      || /aria-label="[^"]*(広告|PR)[^"]*"/i.test(block);
    out.push({ title, id: link[1], isAd, source: 'dom' });
  }
  return out;
}

/** HTML から商品を抽出する。JSON を優先し、駄目なら DOM。 */
export function extractItems(html) {
  const fromJson = extractFromJson(html);
  const nonAdJson = fromJson.filter((i) => !i.isAd);
  if (nonAdJson.length >= 10) return { items: fromJson, strategy: 'json' };

  const fromDom = extractFromDom(html);
  if (fromDom.length > 0) return { items: fromDom, strategy: 'dom' };
  return { items: fromJson, strategy: fromJson.length ? 'json(weak)' : 'none' };
}

/** id と正規化タイトルで重複を落とす */
export function dedupe(items) {
  const seenId = new Set();
  const seenTitle = new Set();
  const out = [];
  for (const item of items) {
    const key = normalizeTight(item.title);
    if (item.id && seenId.has(item.id)) continue;
    if (seenTitle.has(key)) continue;
    if (item.id) seenId.add(item.id);
    seenTitle.add(key);
    out.push(item);
  }
  return out;
}

// ---------------------------------------------------------------- 集計

export function aggregate(titles) {
  const models = new Map(); // name -> { name, maker, count, codes: Map, guessed: Map }

  for (const title of titles) {
    const hits = detectCars(title);
    const guessed = hits.length === 1 ? guessCodes(title) : [];

    for (const { car, codes } of hits) {
      let entry = models.get(car.name);
      if (!entry) {
        entry = { name: car.name, maker: car.maker, count: 0, codes: new Map(), guessed: new Map() };
        models.set(car.name, entry);
      }
      entry.count += 1;
      for (const code of codes) entry.codes.set(code, (entry.codes.get(code) ?? 0) + 1);
      for (const code of guessed) {
        if (codes.includes(code)) continue;
        entry.guessed.set(code, (entry.guessed.get(code) ?? 0) + 1);
      }
    }
  }

  const byCount = (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ja');
  return [...models.values()]
    .map((m) => ({
      name: m.name,
      maker: m.maker,
      count: m.count,
      codes: [...m.codes.entries()].sort(byCount).map(([code, count]) => ({ code, count })),
      guessedCodes: [...m.guessed.entries()].sort(byCount).map(([code, count]) => ({ code, count })),
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ja'));
}
