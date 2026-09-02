// tsc は "@/" のパスエイリアスを型チェック用にしか解決せず、出力JSのrequire文は
// 書き換えない。そのためコンパイル後のJSを node で実行する際に "@/" を
// tools/dist/src/ へ解決するための最小限のフックをここで追加する。
"use strict";

const Module = require("node:module");
const path = require("node:path");

const distSrcRoot = path.join(__dirname, "dist", "src");
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function (request, ...rest) {
  if (request.startsWith("@/")) {
    const rewritten = path.join(distSrcRoot, request.slice(2));
    return originalResolveFilename.call(this, rewritten, ...rest);
  }
  return originalResolveFilename.call(this, request, ...rest);
};
