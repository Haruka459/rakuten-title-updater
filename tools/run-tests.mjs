// tools/logic.test.ts を tsc で tools/dist 配下にコンパイルし、node で実行するラッパ。
// 使い方: node tools/run-tests.mjs

import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolsDir, "..");
const distDir = path.join(toolsDir, "dist");

if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true, force: true });
}

console.log("[1/2] tsc でコンパイル中...");
try {
  execFileSync("tsc", ["-p", "tools/tsconfig.test.json"], {
    cwd: repoRoot,
    stdio: "inherit",
  });
} catch {
  console.error("コンパイルに失敗しました");
  process.exit(1);
}

console.log("[2/2] テストを実行中...");
try {
  execFileSync(
    "node",
    ["-r", "./" + path.join("tools", "register-alias.cjs"), path.join("tools", "dist", "tools", "logic.test.js")],
    { cwd: repoRoot, stdio: "inherit" },
  );
} catch {
  console.error("テストに失敗しました");
  process.exit(1);
}

console.log("\nすべてのテストが成功しました。");
