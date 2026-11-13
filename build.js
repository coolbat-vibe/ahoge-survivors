#!/usr/bin/env node
// ============================================================================
// Zero-Dependency Single-File Offline Bundler for
// 《呆毛幸存者：离谱地下城》 | AHOGE SURVIVORS: Absurdia
// Compiles src/* -> standalone offline-playable ahoge-survivors.html
// ============================================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');

const JS_ORDER = [
  'data.js',
  'spatial.js',
  'audio.js',
  'sprites.js',
  'effects.js',
  'entities.js',
  'weapons.js',
  'game.js',
  'ui.js'
];

const template = fs.readFileSync(path.join(SRC, 'template.html'), 'utf8');
const css = fs.readFileSync(path.join(SRC, 'styles.css'), 'utf8');

const jsChunks = JS_ORDER.map((file) => {
  const full = path.join(SRC, file);
  const code = fs.readFileSync(full, 'utf8');
  return `\n// --- MODULE: ${file} ---\n${code}`;
});

const bundledJs = `(function () {\n'use strict';\n${jsChunks.join('\n')}\nwindow.__AHOGE_APP__ = { getGame: () => GAME, getUI: () => UI, getFX: () => FX, getLang: () => LANG, setLang: setGameLang };\n})();`;

// 1. Syntax check via Node vm.Script
new vm.Script(bundledJs, { filename: 'ahoge-survivors.bundle.js' });

// 2. Assemble single-file HTML
const finalHtml = template
  .replace('/*__INLINE_CSS__*/', () => css)
  .replace('/*__INLINE_JS__*/', () => bundledJs);

// 3. Offline purity check (no external runtime asset dependencies; allow user's X link)
const ALLOWED_LINKS = new Set(['https://x.com/coolbat1999']);
const extMatches = (finalHtml.match(/https?:\/\/[^\s"'<>)]+/g) || []).filter(
  (u) => !ALLOWED_LINKS.has(u)
);
if (extMatches.length > 0) {
  throw new Error(`Found unexpected external URLs in offline bundle: ${extMatches.join(', ')}`);
}

const outPath = path.join(ROOT, 'ahoge-survivors.html');
fs.writeFileSync(outPath, finalHtml, 'utf8');

const kb = (Buffer.byteLength(finalHtml, 'utf8') / 1024).toFixed(1);
console.log(`✅ Built standalone single-file game: ${outPath} (${kb} KB)`);
console.log(`✅ Syntax verified & 100% offline zero-external-URL verified!`);
