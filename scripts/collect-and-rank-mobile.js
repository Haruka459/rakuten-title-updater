/**
 * 楽天の検索結果から商品タイトルを集め、その場で
 * 「車種名ランキング」と「車種ごとの型式ランキング」まで作る（スマホ向け）。
 *
 * このファイルはテンプレート。__MAKERS__ と __DICT__ に
 * scripts/lib/car-dictionary.mjs の中身が埋め込まれる。
 *
 *   node scripts/build-mobile-ranking.mjs
 *
 * 生成物 scripts/rank-bookmarklet.txt をブックマークの URL 欄に貼って使う。
 */
void (async () => {
  var PAGES = 3;
  var WANT = 100;
  var TOP = 50;
  var WAIT_MS = 1200;

  if (!location.hostname.endsWith('rakuten.co.jp')) {
    alert('楽天の検索結果ページで実行してください。');
    return;
  }

  /* --- LOGIC START --- */
  var MAKERS = '__MAKERS__'.split(',');
  var DICT = '__DICT__';

  var CARS = DICT.split('~').map(function (rec) {
    var f = rec.split('|');
    return {
      name: f[0],
      maker: f[1],
      aliases: f[2] ? [f[0]].concat(f[2].split(',')) : [f[0]],
      codes: f[3] ? f[3].split(',') : [],
      notPartOf: f[4] ? f[4].split(',') : [],
      strict: f[5] === '1',
    };
  });

  var SEP = /[\s　\-_/｜|･・、，,．.:：;；()（）\[\]【】「」『』+＋]+/g;
  var HIRAGANA = /[ぁ-ゖ]/;
  var KATAKANA_ONLY = /^[ァ-ヺー]+$/;
  var ALNUM = /[A-Z0-9]/;

  function normSpaced(s) {
    return String(s).normalize('NFKC').toUpperCase().replace(SEP, ' ').trim();
  }
  function normTight(s) {
    return normSpaced(s).replace(/ /g, '');
  }

  function countOcc(hay, needle) {
    if (!needle) return 0;
    var n = 0;
    var from = 0;
    for (;;) {
      var i = hay.indexOf(needle, from);
      if (i === -1) return n;
      n += 1;
      from = i + 1;
    }
  }

  // [i, i+len) が word の出現範囲に収まっているか
  function coveredBy(text, i, len, word) {
    var from = 0;
    for (;;) {
      var j = text.indexOf(word, from);
      if (j === -1) return false;
      if (j <= i && i + len <= j + word.length) return true;
      from = j + 1;
    }
  }

  // 車種名として現れる回数。直後がひらがな／長音符、notPartOf の語の一部なら数えない
  function aliasCount(text, alias, katakana, notPartOf) {
    var endsLong = alias.charAt(alias.length - 1) === 'ー';
    var n = 0;
    var from = 0;
    for (;;) {
      var i = text.indexOf(alias, from);
      if (i === -1) return n;
      from = i + 1;
      var after = text.charAt(i + alias.length);
      if (katakana && (HIRAGANA.test(after) || (!endsLong && after === 'ー'))) continue;
      var blocked = false;
      for (var k = 0; k < notPartOf.length; k += 1) {
        if (coveredBy(text, i, alias.length, notPartOf[k])) { blocked = true; break; }
      }
      if (!blocked) n += 1;
    }
  }

  // 型式が単語として現れるか。前後が英数字なら別の語の一部とみなす
  function codeAppears(spaced, code) {
    if (code.charAt(code.length - 1) === '系') {
      var at = spaced.indexOf(code);
      return at !== -1 && !/[0-9]/.test(spaced.charAt(at - 1));
    }
    var from = 0;
    for (;;) {
      var i = spaced.indexOf(code, from);
      if (i === -1) return false;
      if (!ALNUM.test(spaced.charAt(i - 1)) && !ALNUM.test(spaced.charAt(i + code.length))) return true;
      from = i + 1;
    }
  }

  var PREPARED = CARS.map(function (car) {
    return {
      car: car,
      aliases: car.aliases.map(function (raw) {
        return {
          spaced: normSpaced(raw),
          tight: normTight(raw),
          katakana: KATAKANA_ONLY.test(raw),
        };
      }),
      notPartOf: car.notPartOf.map(normSpaced),
      codes: car.codes.map(normTight),
    };
  });

  var NORM_MAKERS = MAKERS.map(normTight);

  function detectCars(title) {
    var spaced = normSpaced(title);
    var tight = normTight(title);
    var hits = [];

    for (var c = 0; c < PREPARED.length; c += 1) {
      var p = PREPARED[c];
      var matched = [];
      for (var a = 0; a < p.aliases.length; a += 1) {
        var al = p.aliases[a];
        var n = aliasCount(spaced, al.spaced, al.katakana, p.notPartOf);
        if (n === 0 && al.tight !== al.spaced) {
          n = aliasCount(tight, al.tight, al.katakana, p.notPartOf);
        }
        if (n > 0) matched.push({ text: al.tight, count: n });
      }
      if (matched.length === 0) continue;

      var codes = p.codes.filter(function (code) { return codeAppears(spaced, code); });

      if (p.car.strict) {
        var hasMaker = NORM_MAKERS.some(function (m) { return tight.indexOf(m) !== -1; });
        if (!hasMaker && codes.length === 0) continue;
      }
      hits.push({ car: p.car, codes: codes, matched: matched });
    }

    // 「ジムニーシエラ」の中の「ジムニー」のような包含は具体的な方だけ残す
    return hits.filter(function (x) {
      return x.matched.some(function (mine) {
        var inside = 0;
        for (var y = 0; y < hits.length; y += 1) {
          if (hits[y] === x) continue;
          var others = hits[y].matched;
          for (var o = 0; o < others.length; o += 1) {
            var longer = others[o].text;
            if (longer === mine.text || longer.indexOf(mine.text) === -1) continue;
            inside += countOcc(tight, longer) * countOcc(longer, mine.text);
          }
        }
        return mine.count > inside;
      });
    });
  }

  var GUESS_SERIES = /([0-9]{2,3})系/g;
  var GUESS_ALNUM = /[A-Z]{1,4}[0-9]{1,3}[A-Z]{0,3}/g;
  var BLOCK = ('H1,H3,H4,H7,H8,H9,H10,H11,H16,HB3,HB4,HIR2,PSX24W,PSX26W,D1S,D2S,D2R,D3S,D4S,D4R,'
    + 'T10,T15,T16,T20,S25,G14,W5W,BA9S,M5,M6,M8,M10,M12,M14,P1,P15,JIS,ISO,USB,LED,HID,ABS,PVC,'
    + 'SUS304,A4,A3,B5,B4,CO2,MT5,AT4,CVT,DC12,AC100,2WD,4WD,AWD').split(',');

  function guessCodes(title) {
    var spaced = normSpaced(title);
    var found = [];
    var m;
    GUESS_SERIES.lastIndex = 0;
    while ((m = GUESS_SERIES.exec(spaced)) !== null) {
      if (!/[0-9]/.test(spaced.charAt(m.index - 1)) && found.indexOf(m[1] + '系') === -1) {
        found.push(m[1] + '系');
      }
    }
    GUESS_ALNUM.lastIndex = 0;
    while ((m = GUESS_ALNUM.exec(spaced)) !== null) {
      var code = m[0];
      if (code.length < 3) continue;
      if (ALNUM.test(spaced.charAt(m.index - 1))) continue;
      if (ALNUM.test(spaced.charAt(m.index + code.length))) continue;
      if (BLOCK.indexOf(code) !== -1) continue;
      if (found.indexOf(code) === -1) found.push(code);
    }
    return found;
  }

  function aggregate(titles) {
    var models = {};
    var order = [];

    for (var t = 0; t < titles.length; t += 1) {
      var hits = detectCars(titles[t]);
      var guessed = hits.length === 1 ? guessCodes(titles[t]) : [];

      for (var h = 0; h < hits.length; h += 1) {
        var car = hits[h].car;
        var entry = models[car.name];
        if (!entry) {
          entry = { name: car.name, maker: car.maker, count: 0, codes: {}, guessed: {} };
          models[car.name] = entry;
          order.push(car.name);
        }
        entry.count += 1;
        var codes = hits[h].codes;
        for (var i = 0; i < codes.length; i += 1) {
          entry.codes[codes[i]] = (entry.codes[codes[i]] || 0) + 1;
        }
        for (var g = 0; g < guessed.length; g += 1) {
          if (codes.indexOf(guessed[g]) !== -1) continue;
          entry.guessed[guessed[g]] = (entry.guessed[guessed[g]] || 0) + 1;
        }
      }
    }

    var rank = function (map) {
      return Object.keys(map).map(function (k) { return { code: k, count: map[k] }; })
        .sort(function (a, b) { return b.count - a.count || a.code.localeCompare(b.code, 'ja'); });
    };

    return order.map(function (name) {
      var m = models[name];
      return {
        name: m.name, maker: m.maker, count: m.count,
        codes: rank(m.codes), guessedCodes: rank(m.guessed),
      };
    }).sort(function (a, b) {
      return b.count - a.count || a.name.localeCompare(b.name, 'ja');
    });
  }
  /* --- LOGIC END --- */

  // ------------------------------------------------------------ 取得

  var ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  function cleanTitle(raw) {
    return String(raw)
      .replace(/<[^>]*>/g, '')
      .replace(/&#x([0-9a-f]+);/gi, function (m, h) { return String.fromCodePoint(parseInt(h, 16)); })
      .replace(/&#([0-9]+);/g, function (m, d) { return String.fromCodePoint(Number(d)); })
      .replace(/&([a-z]+);/gi, function (m, n) { return ENTITIES[n.toLowerCase()] || m; })
      .replace(/\s+/g, ' ')
      .trim();
  }

  function fromDom(doc) {
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
        var txt = (badges[b].textContent || '').trim();
        if (txt === 'PR' || txt === '広告' || txt === '[PR]' || txt === '【PR】') { isAd = true; break; }
      }
      if (!isAd) isAd = /(^|\s)(ad|ads|sponsor)[a-z-]*(\s|$)/i.test(String(card.className || ''));
      out.push({ title: title, href: a.href, isAd: isAd });
    }
    return out;
  }

  function fromHtml(html) {
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
  }

  function pageUrl(p) {
    var url = new URL(location.href);
    if (p > 1) url.searchParams.set('p', String(p));
    else url.searchParams.delete('p');
    return url.toString();
  }

  var toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;left:8px;right:8px;top:8px;z-index:2147483647;background:#111;'
    + 'color:#fff;font:14px/1.5 sans-serif;padding:10px 12px;border-radius:8px;';
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
    var nonAd = function (list) { return list.filter(function (x) { return !x.isAd; }).length; };
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

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  toast.textContent = '集計中…';
  var models = aggregate(titles);
  toast.remove();

  // ------------------------------------------------------------ 表示

  var matchedTitles = titles.filter(function (t) { return detectCars(t).length > 0; }).length;

  var summary = titles.length + ' 件を集計（PR除外 ' + adTotal + ' 件 / 車種を判定できたもの '
    + matchedTitles + ' 件）';
  if (failed) summary += ' ※途中で取得に失敗: ' + failed;

  var lines = ['# 楽天「' + decodeURIComponent(location.pathname.split('/')[3] || '') + '」タイトル分析', '',
    '- ' + summary, '', '## 車種名ランキング', ''];
  models.slice(0, TOP).forEach(function (m, i) {
    var codes = m.codes.slice(0, 5).map(function (c) { return c.code + '(' + c.count + ')'; }).join(' / ');
    lines.push((i + 1) + '. ' + m.name + '（' + m.maker + '） ' + m.count + '件  ' + (codes || '型式なし'));
  });
  lines.push('', '## 車種別 型式ランキング', '');
  models.slice(0, TOP).forEach(function (m, i) {
    lines.push('### ' + (i + 1) + '. ' + m.name + ' — ' + m.count + '件');
    if (m.codes.length === 0) lines.push('型式の記載なし');
    m.codes.forEach(function (c) { lines.push('- ' + c.code + ': ' + c.count + '件'); });
    if (m.guessedCodes.length > 0) {
      lines.push('- 辞書外の候補（推定）: ' + m.guessedCodes.slice(0, 8).map(function (c) {
        return c.code + '(' + c.count + ')';
      }).join(' / '));
    }
    lines.push('');
  });
  lines.push('## 集計に使ったタイトル', '');
  titles.forEach(function (t, i) { lines.push((i + 1) + '. ' + t); });
  var report = lines.join('\n');

  var panel = document.createElement('div');
  panel.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#fff;color:#111;'
    + 'font:15px/1.7 sans-serif;display:flex;flex-direction:column;padding:12px;box-sizing:border-box;';

  var head = document.createElement('div');
  head.textContent = summary;
  head.style.cssText = 'font-weight:bold;font-size:13px;margin-bottom:8px;line-height:1.5;';

  var body = document.createElement('div');
  body.style.cssText = 'flex:1;overflow:auto;-webkit-overflow-scrolling:touch;';

  if (titles.length === 0) {
    body.textContent = 'タイトルを1件も取れませんでした。楽天のページ構造が変わった可能性があります。';
  } else if (models.length === 0) {
    body.textContent = 'タイトルは取れましたが、車種名を判定できませんでした。';
  } else {
    var html2 = '<ol style="margin:0;padding-left:2.2em">';
    models.slice(0, TOP).forEach(function (m) {
      var top3 = m.codes.slice(0, 3).map(function (c) { return c.code + '(' + c.count + ')'; }).join(' ');
      var all = m.codes.map(function (c) { return c.code + ' … ' + c.count + '件'; }).join('<br>');
      if (m.guessedCodes.length > 0) {
        all += (all ? '<br>' : '') + '<span style="color:#888">推定: '
          + m.guessedCodes.slice(0, 8).map(function (c) { return c.code + '(' + c.count + ')'; }).join(' ')
          + '</span>';
      }
      html2 += '<li style="margin-bottom:6px"><b>' + m.name + '</b>'
        + ' <span style="color:#666;font-size:13px">' + m.maker + '</span>'
        + ' <b style="color:#0a7">' + m.count + '件</b>'
        + (m.codes.length
          ? '<details style="font-size:13px;color:#444"><summary>' + top3 + '</summary>'
            + '<div style="padding:4px 0 4px 4px">' + all + '</div></details>'
          : '<div style="font-size:13px;color:#999">型式なし</div>')
        + '</li>';
    });
    html2 += '</ol>';
    body.innerHTML = html2;
  }

  var row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:8px;margin-top:10px;';
  function mkBtn(label, bg) {
    var b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = 'flex:1;padding:14px;font-size:16px;border:0;border-radius:8px;background:'
      + bg + ';color:#fff;';
    return b;
  }

  var hidden = document.createElement('textarea');
  hidden.value = report;
  hidden.readOnly = true;
  hidden.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;';
  panel.appendChild(hidden);

  var copyBtn = mkBtn('結果をコピー', '#0a7');
  copyBtn.onclick = function () {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(report).then(function () {
        copyBtn.textContent = 'コピーしました';
      }, legacyCopy);
      return;
    }
    legacyCopy();
  };
  function legacyCopy() {
    hidden.style.cssText = 'position:static;width:100%;height:4rem;opacity:1;';
    hidden.focus();
    hidden.select();
    hidden.setSelectionRange(0, report.length);
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    hidden.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;';
    copyBtn.textContent = ok ? 'コピーしました' : '長押しで選択してください';
  }

  var closeBtn = mkBtn('閉じる', '#666');
  closeBtn.onclick = function () { panel.remove(); };

  row.appendChild(copyBtn);
  row.appendChild(closeBtn);
  panel.appendChild(head);
  panel.appendChild(body);
  panel.appendChild(row);
  document.body.appendChild(panel);
})();
