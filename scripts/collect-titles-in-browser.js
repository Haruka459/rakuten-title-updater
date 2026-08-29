/**
 * 楽天の検索結果ページから、PR（広告）を除いた商品タイトルを集めるスニペット。
 *
 * 使い方:
 *   1. 楽天の検索結果ページを開く
 *      例) https://search.rakuten.co.jp/search/mall/車　カスタム/
 *   2. ブラウザの開発者ツールを開く（Windows: F12 / Mac: Cmd+Option+I）
 *   3. 「Console」タブに、このファイルの中身をまるごと貼り付けて Enter
 *   4. タイトルがクリップボードにコピーされる（コンソールにも一覧が出る）
 *
 * ページ送りは自動で、既定は3ページ＝最大100件。
 * 件数やキーワードを変えたいときは下の CONFIG をいじってください。
 *
 * 集めたタイトルは、そのまま Claude に貼るか、テキストに保存して
 *   npm run rank -- --titles titles.txt
 * で集計できます。
 */
(async () => {
  const CONFIG = {
    pages: 3,      // 何ページ分たどるか（1ページ45件前後）
    want: 100,     // 集める件数の上限
    waitMs: 1200,  // ページ取得の間隔。楽天に負荷をかけないため短くしすぎない
  };

  if (!location.hostname.endsWith('rakuten.co.jp')) {
    console.error('楽天の検索結果ページで実行してください。');
    return;
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  const cleanTitle = (raw) => String(raw)
    .replace(/<[^>]*>/g, '')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#([0-9]+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
    .replace(/\s+/g, ' ')
    .trim();

  /** DOM をたどって商品カードから取る */
  const fromDom = (doc) => {
    const out = [];
    const links = doc.querySelectorAll('a[href*="item.rakuten.co.jp"]');
    for (const a of links) {
      const title = cleanTitle(a.textContent);
      if (title.length < 8) continue;

      // 商品カードらしき祖先をさかのぼって探す
      let card = a;
      for (let i = 0; i < 6 && card.parentElement; i += 1) {
        card = card.parentElement;
        const cls = card.className && String(card.className);
        if (cls && /searchresultitem|dui-card|item|product/i.test(cls)) break;
      }

      const isAd = [...card.querySelectorAll('span,div,p,em,i')]
        .some((el) => {
          const t = (el.textContent || '').trim();
          return t === 'PR' || t === '広告' || t === '[PR]' || t === '【PR】';
        })
        || /(^|\s)(ad|ads|sponsor)[a-z-]*(\s|$)/i.test(String(card.className || ''));

      out.push({ title, href: a.href, isAd });
    }
    return out;
  };

  /** HTML 文字列を正規表現で刻む（DOM 側が空振りしたときの保険） */
  const fromHtml = (html) => {
    const boundary = /<(?:div|li)\b[^>]*(?:class="[^"]*(?:searchresultitem|dui-card|searchresultitems-item)[^"]*"|data-testid="[^"]*(?:search-result|item-card)[^"]*")[^>]*>/gi;
    const starts = [...html.matchAll(boundary)].map((m) => m.index);
    const blocks = starts.length > 0
      ? starts.map((s, i) => html.slice(s, starts[i + 1] ?? html.length))
      : [];

    const out = [];
    for (const block of blocks) {
      const link = block.match(/<a\b[^>]*href="(https?:\/\/item\.rakuten\.co\.jp\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      if (!link) continue;
      const title = cleanTitle(link[2]);
      if (title.length < 8) continue;
      const isAd = />\s*(?:PR|広告)\s*</i.test(block)
        || /class="[^"]*\b(?:ad|ads|sponsor)[a-z-]*\b[^"]*"/i.test(block);
      out.push({ title, href: link[1], isAd });
    }
    return out;
  };

  const pageUrl = (p) => {
    const url = new URL(location.href);
    if (p > 1) url.searchParams.set('p', String(p));
    else url.searchParams.delete('p');
    return url.toString();
  };

  const titles = [];
  const seenTitle = new Set();
  const seenHref = new Set();
  let adTotal = 0;

  for (let p = 1; p <= CONFIG.pages && titles.length < CONFIG.want; p += 1) {
    const url = pageUrl(p);
    console.log(`取得中 (${p}/${CONFIG.pages}): ${url}`);

    let html;
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      html = await res.text();
    } catch (err) {
      console.error(`${url} の取得に失敗しました:`, err.message);
      break;
    }

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const byDom = fromDom(doc);
    const byHtml = fromHtml(html);
    // 非PRの件数が多い方を採用する
    const nonAd = (list) => list.filter((i) => !i.isAd).length;
    const items = nonAd(byDom) >= nonAd(byHtml) ? byDom : byHtml;
    console.log(`  DOM: ${nonAd(byDom)}件 / HTML: ${nonAd(byHtml)}件 → ${nonAd(items)}件を採用`);

    for (const item of items) {
      if (item.isAd) { adTotal += 1; continue; }
      const key = item.title.normalize('NFKC').replace(/\s/g, '');
      if (seenTitle.has(key) || (item.href && seenHref.has(item.href))) continue;
      seenTitle.add(key);
      if (item.href) seenHref.add(item.href);
      titles.push(item.title);
      if (titles.length >= CONFIG.want) break;
    }

    if (p < CONFIG.pages && titles.length < CONFIG.want) await sleep(CONFIG.waitMs);
  }

  if (titles.length === 0) {
    console.error('タイトルを1件も取れませんでした。楽天のページ構造が変わった可能性があります。');
    return;
  }
  if (adTotal === 0) {
    console.warn('PR（広告）を1件も検出できませんでした。除外できていない可能性があります。');
  }

  const text = titles.join('\n');
  console.log(`\n=== ${titles.length} 件（PR除外 ${adTotal} 件）===\n`);
  console.log(text);

  try {
    await navigator.clipboard.writeText(text);
    console.log('\nクリップボードにコピーしました。');
  } catch {
    if (typeof copy === 'function') {
      copy(text);
      console.log('\nクリップボードにコピーしました。');
    } else {
      console.log('\n上の一覧を選択してコピーしてください。');
    }
  }

  globalThis.rakutenTitles = titles;
})();
