// 自動生成。編集しないこと。
// 生成元: scripts/collect-and-rank-mobile.js + scripts/lib/car-dictionary.mjs
// 生成方法: node scripts/build-mobile-ranking.mjs

var MAKERS = 'トヨタ,TOYOTA,ホンダ,HONDA,日産,ニッサン,NISSAN,スズキ,SUZUKI,ダイハツ,DAIHATSU,マツダ,MAZDA,スバル,SUBARU,三菱,ミツビシ,MITSUBISHI,レクサス,LEXUS,フォルクスワーゲン,VW,BMW,ベンツ,メルセデス,アウディ,AUDI,ジープ,JEEP,MINI,ボルボ,VOLVO,プジョー,ルノー'.split(',');
  var DICT = 'ハイエース|トヨタ|HIACE|200系,100系,TRH200V,TRH200K,KDH200V,KDH201V,GDH201V,GDH211K,TRH224W,TRH229W||~アルファード|トヨタ|ALPHARD|40系,30系,20系,10系,AGH40W,AAHH40W,AGH30W,GGH30W,AYH30W,ANH20W,GGH20W,ANH10W,MNH10W||~ヴェルファイア|トヨタ|ベルファイア,VELLFIRE|40系,30系,20系,AGH40W,AAHH40W,AGH30W,GGH30W,AYH30W,ANH20W,GGH20W||~プリウス|トヨタ|PRIUS|60系,50系,30系,20系,MXWH60,MXWH61,ZVW60,ZVW61,ZVW50,ZVW51,ZVW55,ZVW30,ZVW35,NHW20,ZVW41W,ZVW40W||~アクア|トヨタ|AQUA|MXPK11,MXPK10,MXPK15,MXPK16,NHP10,10系|アクアリウム,アクアマリン|1~ノア|トヨタ|NOAH|90系,80系,70系,60系,ZWR90W,MZRA90W,ZRR80G,ZRR80W,ZWR80G,ZRR70G,ZRR70W,AZR60G,AZR65G||1~ヴォクシー|トヨタ|ボクシー,VOXY|90系,80系,70系,60系,ZWR90W,MZRA90W,ZRR80W,ZWR80W,ZRR70W,AZR60G||~エスクァイア|トヨタ|エスクワイア,ESQUIRE|80系,ZRR80G,ZWR80G||~シエンタ|トヨタ|SIENTA|10系,170系,MXPC10,MXPL10,MXPL15,NSP170G,NHP170G,NCP175G,NCP81G,NCP85G||~ランドクルーザー|トヨタ|ランクル,LANDCRUISER,LANDCRUISER|300系,200系,100系,80系,70系,250,VJA300W,FJA300W,URJ202W,UZJ200W,GDJ250W,GRJ250W,GRJ76K,GRJ79K||~ランドクルーザープラド|トヨタ|ランクルプラド,プラド,PRADO|150系,120系,90系,TRJ150W,GDJ150W,GDJ151W,GRJ150W,GRJ151W,TRJ120W,RZJ120W||~ハリアー|トヨタ|HARRIER|80系,60系,30系,10系,MXUA80,MXUA85,AXUH80,AXUH85,ZSU60W,ZSU65W,ASU60W,ACU30W,GSU35W||~RAV4|トヨタ|ラブ4|50系,MXAA54,AXAH54,AXAP54,MXAA52,AXAH52,ACA31W,ACA36W||~C-HR|トヨタ|CHR|ZYX10,ZYX11,NGX10,NGX50||~ヤリス|トヨタ|YARIS|MXPA10,MXPA15,KSP210,MXPH10,MXPH15,GXPA16||~ヤリスクロス|トヨタ|YARISCROSS|MXPB10,MXPB15,MXPJ10,MXPJ15||~ヴィッツ|トヨタ|ビッツ,VITZ|NCP131,KSP130,NSP130,NSP135,NCP91,NCP95,SCP10,NCP10||~カローラ|トヨタ|COROLLA|ZWE211,ZWE214,ZRE212,NRE210,MZEA12,ZWE211W,NZE161G,NKE165G,NRE161G,ZRE212W,NZE141,ZRE142||~クラウン|トヨタ|CROWN|220系,210系,200系,180系,TZSH35,AZSH35,ARS220,AZSH20,AZSH21,GWS224,GRS210,GRS214,AWS210,AWS211,GRS200,GRS202,GRS182||~マークX|トヨタ|MARKX|GRX130,GRX133,GRX135,GRX120,GRX121||~86|トヨタ|ハチロク,GR86|ZN6,ZN8||1~スープラ|トヨタ|SUPRA|DB42,DB02,DB22,JZA80,JZA70||~パッソ|トヨタ|PASSO|M700A,M710A,KGC30,KGC35,NGC30||~ルーミー|トヨタ|ROOMY|M900A,M910A||~ライズ|トヨタ|RAIZE|A200A,A201A,A202A,A210A|サンライズ,ライズアップ|1~ハイラックス|トヨタ|HILUX|GUN125,GUN126||~タウンエース|トヨタ|TOWNACE|S403M,S413M,S402M,S412M||~エスティマ|トヨタ|ESTIMA|50系,30系,ACR50W,GSR50W,AHR20W,ACR30W,MCR30W||~bB|トヨタ||NCP31,NCP30,QNC20,QNC21||1~レクサスRX|レクサス|LEXUSRX|AGL20W,AGL25W,GYL20W,GYL25W,TALA15,AALH10,GGL10W||~レクサスNX|レクサス|LEXUSNX|AGZ10,AGZ15,AYZ10,AYZ15,AAZH20,AAZH25,TAZA25||~レクサスIS|レクサス|LEXUSIS|ASE30,GSE31,GSE35,AVE30,GSE21,GSE20||~レクサスLX|レクサス|LEXUSLX|VJA310W,URJ201W||~N-BOX|ホンダ|NBOX,エヌボックス|JF5,JF6,JF3,JF4,JF1,JF2||~N-WGN|ホンダ|NWGN,エヌワゴン|JH3,JH4,JH1,JH2||~N-ONE|ホンダ|エヌワン|JG3,JG4,JG1,JG2||~N-VAN|ホンダ|NVAN,エヌバン|JJ1,JJ2||~フィット|ホンダ|FIT|GR1,GR2,GR3,GR4,GR5,GR6,GR7,GR8,GK3,GK4,GK5,GK6,GP5,GP6,GE6,GE7,GE8,GE9,GD1,GD2,GD3|フィットネス,フィッティング,ベンチフィット|1~ヴェゼル|ホンダ|ベゼル,VEZEL|RV3,RV4,RV5,RV6,RU1,RU2,RU3,RU4||~フリード|ホンダ|FREED|GT1,GT3,GB5,GB6,GB7,GB8,GB3,GB4,GP3||~ステップワゴン|ホンダ|STEPWGN,STEPWAGON|RP6,RP7,RP8,RP3,RP4,RP5,RK5,RK6,RG1,RG3,RF3,RF5||~オデッセイ|ホンダ|ODYSSEY|RC1,RC2,RC4,RB1,RB2,RB3,RB4,RA6,RA7||~シビック|ホンダ|CIVIC|FL1,FL4,FL5,FK7,FK8,FC1,FD2,EK9,EG6,EF9||~CR-V|ホンダ|CRV|RW1,RW2,RT5,RT6,RE3,RE4,RD5,RD1||~ヴァモス|ホンダ|バモス,VAMOS|HM1,HM2,HM3,HM4||~S660|ホンダ||JW5||~セレナ|日産|SERENA|C28,GC28,FC28,C27,GC27,GFC27,HC27,HFC27,GNC27,C26,HC26,C25,C24||~デイズ|日産|DAYZ|B44W,B45W,B46W,B47W,B21W,B11W||~ルークス|日産|ROOX|B44A,B45A,B47A,B48A,B21A,ML21S||~エクストレイル|日産|X-TRAIL,XTRAIL|T33,SNT33,T32,NT32,HT32,HNT32,T31,NT31,T30||~ノート|日産|NOTE|E13,SNE13,E12,HE12,NE12,SNE12,E11|ノートパソコン,ノートPC|1~エルグランド|日産|ELGRAND|E52,PE52,TE52,PNE52,TNE52,E51,NE51,ME51,E50||~キャラバン|日産|CARAVAN,NV350|E26,VR2E26,VW2E26,CS4E26,QR2E26,KS2E26,E25||~スカイライン|日産|SKYLINE|V37,HV37,RV37,V36,CKV36,V35,ER34,BNR34,BCNR33,BNR32,HCR32,R34,R33,R32||~フェアレディZ|日産|フェアレディ,FAIRLADY|RZ34,Z34,Z33,Z32,Z31,S30||~リーフ|日産|LEAF|ZE1,AZE0,ZE0||1~ジューク|日産|JUKE|F15,YF15,NF15||~キックス|日産|KICKS|P15,SNP15||~マーチ|日産|MARCH|K13,NK13,AK12,K12,K11||1~キューブ|日産|CUBE|Z12,NZ12,Z11,BZ11|アイスキューブ|1~ジムニー|スズキ|JIMNY|JB64W,JB74W,JB23W,JB33W,JB43W,JA11V,JA12,JA22W,JB31W||~ハスラー|スズキ|HUSTLER|MR52S,MR92S,MR31S,MR41S||~ワゴンR|スズキ|WAGONR|MH85S,MH95S,MH55S,MH35S,MH34S,MH44S,MH23S,MH21S,MH22S,MC21S||~スペーシア|スズキ|SPACIA|MK94S,MK54S,MK53S,MK42S,MK32S,MK33S||~エブリイ|スズキ|エブリィ,エブリー,EVERY|DA17V,DA17W,DA64V,DA64W,DA62V,DA62W,DA52V,DE17V||~アルト|スズキ|ALTO,アルトワークス|HA36S,HA36V,HA37S,HA97S,HA25S,HA25V,HA24S,HA23V,HA12S||~スイフト|スズキ|SWIFT|ZC33S,ZC83S,ZD83S,ZC53S,ZD53S,ZC13S,ZC72S,ZD72S,ZC32S,ZC31S,ZC11S,ZC71S||~ラパン|スズキ|LAPIN|HE33S,HE22S,HE21S||~ソリオ|スズキ|SOLIO|MA37S,MA27S,MA36S,MA46S,MA26S,MA15S,MA34S||~ジムニーシエラ|スズキ|シエラ|JB74W,JB43W||~クロスビー|スズキ|XBEE|MN71S||~タント|ダイハツ|TANTO|LA650S,LA660S,LA600S,LA610S,L375S,L385S,L350S,L360S||~ムーヴ|ダイハツ|ムーブ,MOVE|LA150S,LA160S,LA100S,LA110S,L175S,L185S,L150S,L160S,L900S,L902S||~ムーヴキャンバス|ダイハツ|ムーブキャンバス,キャンバス|LA850S,LA860S,LA800S,LA810S||~ミラ|ダイハツ|MIRA,ミライース,ミラココア|LA350S,LA360S,LA300S,LA310S,L275S,L285S,L675S,L685S,L250S,L260S|ドアミラー,ルームミラー,サイドミラー,バックミラー,ミラー|~キャスト|ダイハツ|CAST|LA250S,LA260S|ダイキャスト,ブロードキャスト,アルミダイキャスト|1~タフト|ダイハツ|TAFT|LA900S,LA910S|クラフト,ドラフト|~ロッキー|ダイハツ|ROCKY|A200S,A201S,A202S,A210S||~コペン|ダイハツ|COPEN|LA400K,LA400A,L880K||~ウェイク|ダイハツ|WAKE|LA700S,LA710S||~アトレー|ダイハツ|ATRAI|S700V,S710V,S321G,S331G,S320G,S330G||~ハイゼット|ダイハツ|HIJET|S500P,S510P,S700V,S710V,S700W,S710W,S321V,S331V,S211P,S201P||~ミラジーノ|ダイハツ|ジーノ|L700S,L710S,L650S,L660S||~ロードスター|マツダ|ROADSTER,MX-5|ND5RC,NDERC,NCEC,NB8C,NB6C,NA8C,NA6CE||~デミオ|マツダ|DEMIO|DJ3FS,DJ5FS,DJ3AS,DJLFS,DE3FS,DE5FS,DE3AS,DY3W,DY5W||~CX-5|マツダ|CX5|KF2P,KF5P,KFEP,KF3P,KE2FW,KE5FW,KEEFW,KE2AW||~CX-3|マツダ|CX3|DK5FW,DK5AW,DKEFW,DKEAW||~CX-8|マツダ|CX8|KG2P,KG5P||~CX-60|マツダ|CX60|KH3P,KH5P,KH3R||~アクセラ|マツダ|AXELA|BM5FS,BMLFS,BM2FS,BM5AS,BYEFP,BL5FP,BLEFP,BK5P,BK3P||~アテンザ|マツダ|ATENZA|GJ2FP,GJ5FP,GJ2AP,GJEFP,GH5FS,GG3P||~MAZDA3|マツダ|マツダ3|BP5P,BP8P,BPFP,BP5R||~RX-7|マツダ|RX7|FD3S,FC3S,SA22C||~RX-8|マツダ|RX8|SE3P||~インプレッサ|スバル|IMPREZA|GT7,GT3,GT2,GK2,GK3,GK6,GJ7,GJ2,GP7,GP2,GRB,GRF,GVB,GVF,GH8,GH2,GDB,GDA,GC8,GF8||~フォレスター|スバル|FORESTER|SK9,SKE,SK5,SJ5,SJG,SH5,SH9,SG5,SG9,SF5||~レヴォーグ|スバル|レボーグ,LEVORG|VN5,VNH,VM4,VMG||~WRX|スバル||VBH,VAB,VAG,GVB,GRB||~BRZ|スバル||ZD8,ZC6||~レガシィ|スバル|レガシー,LEGACY|BT5,BS9,BN9,BR9,BRG,BM9,BMG,BP5,BL5,BE5,BH5||~XV|スバル|スバルXV,SUBARUXV|GT3,GT7,GTE,GP7,GPE||~サンバー|スバル|SAMBAR|TT1,TT2,TV1,TV2,S500J,S510J||~デリカD:5|三菱|デリカD5,DELICAD5|CV1W,CV2W,CV4W,CV5W||~アウトランダー|三菱|OUTLANDER|GN0W,GG3W,GG2W,GF8W,GF7W,CW5W,CW4W||~eKワゴン|三菱|eKクロス,EKワゴン,EKクロス|B33W,B34W,B35W,B36W,B11W,H82W,H81W||~RVR|三菱||GA4W,GA3W||~パジェロ|三菱|PAJERO|V83W,V93W,V97W,V98W,V26W,V45W||~ランサーエボリューション|三菱|ランエボ,ランサー,LANCER|CZ4A,CT9A,CP9A,CN9A,CE9A||~ジープラングラー|ジープ|ラングラー,WRANGLER|JL36,JL20,JK36,JK36L||~ミニ|MINI|MINIクーパー,ミニクーパー|F56,F55,F60,R56,R60,R50||~ゴルフ|VW|GOLF|AUCJZ,AUCPT,CDDLA|ゴルフボール,ゴルフバッグ,ゴルフクラブ,ゴルフ場|1';

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

export { CARS, detectCars, aggregate, guessCodes, normSpaced, normTight };
