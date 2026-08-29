/**
 * 楽天の検索結果ページから、PR（広告）を除いた商品タイトルを集める（スマホ向け）。
 *
 * スマホのブラウザには開発者コンソールが無いので、ブックマークレットとして使う。
 * このファイルから scripts/collect-titles-bookmarklet.txt を生成し、その中身を
 * ブックマークの URL 欄に貼り付けて、楽天の検索結果ページで開く。
 *
 *   node scripts/build-bookmarklet.mjs
 *
 * 結果はページ上に重ねて表示され、「コピー」ボタンでクリップボードに入る。
 */
void (async () => {
  var PAGES = 3;
  var WANT = 100;
  var WAIT_MS = 1200;

  if (!location.hostname.endsWith('rakuten.co.jp')) {
    alert('楽天の検索結果ページで実行してください。');
    return;
  }

  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  var ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  var cleanTitle = function (raw) {
    return String(raw)
      .replace(/<[^>]*>/g, '')
      .replace(/&#x([0-9a-f]+);/gi, function (m, h) { return String.fromCodePoint(parseInt(h, 16)); })
      .replace(/&#([0-9]+);/g, function (m, d) { return String.fromCodePoint(Number(d)); })
      .replace(/&([a-z]+);/gi, function (m, n) { return ENTITIES[n.toLowerCase()] || m; })
      .replace(/\s+/g, ' ')
      .trim();
  };

  var fromDom = function (doc) {
    var out = [];
    var links = doc.querySelectorAll('a[href*="item.rakuten.co.jp"]');
    for (var i = 0; i < links.length; i += 1) {
      var a = links[i];
      var title = cleanTitle(a.textContent);
      if (title.length < 8) continue;

      var card = a;
      for (var d = 0; d < 6 && card.parentElement; d += 1) {
        card = card.parentElement;
        var cls = card.className && String(card.className);
        if (cls && /searchresultitem|dui-card|item|product/i.test(cls)) break;
      }

      var badges = card.querySelectorAll('span,div,p,em,i');
      var isAd = false;
      for (var b = 0; b < badges.length; b += 1) {
        var t = (badges[b].textContent || '').trim();
        if (t === 'PR' || t === '広告' || t === '[PR]' || t === '【PR】') { isAd = true; break; }
      }
      if (!isAd) isAd = /(^|\s)(ad|ads|sponsor)[a-z-]*(\s|$)/i.test(String(card.className || ''));

      out.push({ title: title, href: a.href, isAd: isAd });
    }
    return out;
  };

  var fromHtml = function (html) {
    var boundary = /<(?:div|li)\b[^>]*(?:class="[^"]*(?:searchresultitem|dui-card|searchresultitems-item)[^"]*"|data-testid="[^"]*(?:search-result|item-card)[^"]*")[^>]*>/gi;
    var starts = [];
    var m;
    while ((m = boundary.exec(html)) !== null) starts.push(m.index);

    var out = [];
    for (var i = 0; i < starts.length; i += 1) {
      var block = html.slice(starts[i], starts[i + 1] === undefined ? html.length : starts[i + 1]);
      var link = block.match(/<a\b[^>]*href="(https?:\/\/item\.rakuten\.co\.jp\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      if (!link) continue;
      var title = cleanTitle(link[2]);
      if (title.length < 8) continue;
      var isAd = />\s*(?:PR|広告)\s*</i.test(block)
        || /class="[^"]*\b(?:ad|ads|sponsor)[a-z-]*\b[^"]*"/i.test(block);
      out.push({ title: title, href: link[1], isAd: isAd });
    }
    return out;
  };

  var pageUrl = function (p) {
    var url = new URL(location.href);
    if (p > 1) url.searchParams.set('p', String(p));
    else url.searchParams.delete('p');
    return url.toString();
  };

  // 進捗表示。スマホではコンソールが見えないので画面に出す
  var toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;left:8px;right:8px;top:8px;z-index:2147483647;'
    + 'background:#111;color:#fff;font:14px/1.5 sans-serif;padding:10px 12px;border-radius:8px;';
  toast.textContent = '取得中…';
  document.body.appendChild(toast);

  var titles = [];
  var seenTitle = {};
  var seenHref = {};
  var adTotal = 0;
  var failed = null;

  for (var p = 1; p <= PAGES && titles.length < WANT; p += 1) {
    toast.textContent = '取得中… ' + p + '/' + PAGES + '（' + titles.length + '件）';

    var html;
    try {
      var res = await fetch(pageUrl(p), { credentials: 'include' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      html = await res.text();
    } catch (err) {
      failed = err.message;
      break;
    }

    var doc = new DOMParser().parseFromString(html, 'text/html');
    var byDom = fromDom(doc);
    var byHtml = fromHtml(html);
    var nonAd = function (list) {
      return list.filter(function (x) { return !x.isAd; }).length;
    };
    var items = nonAd(byDom) >= nonAd(byHtml) ? byDom : byHtml;

    for (var k = 0; k < items.length; k += 1) {
      var item = items[k];
      if (item.isAd) { adTotal += 1; continue; }
      var key = item.title.normalize('NFKC').replace(/\s/g, '');
      if (seenTitle[key] || (item.href && seenHref[item.href])) continue;
      seenTitle[key] = 1;
      if (item.href) seenHref[item.href] = 1;
      titles.push(item.title);
      if (titles.length >= WANT) break;
    }

    if (p < PAGES && titles.length < WANT) await sleep(WAIT_MS);
  }

  toast.remove();

  var text = titles.join('\n');
  var note = titles.length + ' 件（PR除外 ' + adTotal + ' 件）';
  if (failed) note += ' / 途中で取得に失敗: ' + failed;
  if (titles.length === 0) note = 'タイトルを1件も取れませんでした。楽天のページ構造が変わった可能性があります。';
  else if (adTotal === 0) note += ' / PRを検出できず、除外できていない可能性があります';

  // 結果パネル
  var panel = document.createElement('div');
  panel.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#fff;color:#111;'
    + 'font:14px/1.6 sans-serif;display:flex;flex-direction:column;padding:12px;box-sizing:border-box;';

  var head = document.createElement('div');
  head.textContent = note;
  head.style.cssText = 'font-weight:bold;margin-bottom:8px;';

  var area = document.createElement('textarea');
  area.readOnly = true;
  area.value = text;
  area.style.cssText = 'flex:1;width:100%;box-sizing:border-box;font:13px/1.5 monospace;'
    + 'padding:8px;border:1px solid #ccc;border-radius:6px;';

  var row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:8px;margin-top:10px;';

  var mkBtn = function (label, bg) {
    var b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = 'flex:1;padding:14px;font-size:16px;border:0;border-radius:8px;'
      + 'background:' + bg + ';color:#fff;';
    return b;
  };

  var copyBtn = mkBtn('コピー', '#0a7');
  copyBtn.onclick = function () {
    area.focus();
    area.select();
    area.setSelectionRange(0, text.length);
    var done = false;
    try { done = document.execCommand('copy'); } catch (e) { done = false; }
    if (!done && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function () {
        copyBtn.textContent = 'コピーしました';
      }, function () {
        copyBtn.textContent = '長押しで選択してコピーしてください';
      });
      return;
    }
    copyBtn.textContent = done ? 'コピーしました' : '長押しで選択してコピーしてください';
  };

  var closeBtn = mkBtn('閉じる', '#666');
  closeBtn.onclick = function () { panel.remove(); };

  row.appendChild(copyBtn);
  row.appendChild(closeBtn);
  panel.appendChild(head);
  panel.appendChild(area);
  panel.appendChild(row);
  document.body.appendChild(panel);
})();
