#!/usr/bin/env node
/**
 * Fails if a banned compound name appears in any customer-facing source file.
 * Banned list: data/ruo-banned.json (the same list lib/ruo.ts enforces at runtime).
 * Prints file:line and a redacted code (M0, M1…), never the name itself.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const banned = JSON.parse(readFileSync(join(root, "data/ruo-banned.json"), "utf8")).map((s) => s.toLowerCase());
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "scripts"]);
const SKIP_FILES = new Set(["data/ruo-banned.json"]);
const EXT = /\.(tsx?|jsx?|mjs|json|css|md|svg|html)$/;

let bad = 0;
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const rel = relative(root, p);
    if (statSync(p).isDirectory()) { if (!SKIP_DIRS.has(name)) walk(p); continue; }
    if (!EXT.test(name) || SKIP_FILES.has(rel) || name === "package-lock.json") continue;
    readFileSync(p, "utf8").split("\n").forEach((line, i) => {
      const l = line.toLowerCase();
      banned.forEach((b, j) => { if (l.includes(b)) { console.error(`${rel}:${i + 1}  banned name M${j}`); bad++; } });
    });
  }
}
walk(root);
if (bad) { console.error(`\ncheck-ruo: ${bad} violation(s).`); process.exit(1); }
console.log("check-ruo: clean");
