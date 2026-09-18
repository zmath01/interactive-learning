#!/usr/bin/env node
// verify.js — structural checks for the interactive-learning site.
// Runs with no dependencies. Exits non-zero on failure.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
let failures = 0;
let checks = 0;

function ok(msg) { checks++; console.log('  PASS ' + msg); }
function bad(msg) { checks++; failures++; console.log('  FAIL ' + msg); }
function check(cond, msg) { cond ? ok(msg) : bad(msg); }

function readJSON(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

console.log('Verifying interactive-learning @ ' + root);

// 1. Required files exist
console.log('\n[files]');
['index.html', 'assets/css/styles.css', 'assets/js/app.js', 'assets/js/engine.js',
 'assets/js/i18n.js', 'assets/js/data.js', 'assets/js/builder.js',
 'data/interactives.json', 'data/i18n.json'].forEach((rel) => {
  check(fs.existsSync(path.join(root, rel)), 'exists: ' + rel);
});

const isBilingual = (o) => o && typeof o.en === 'string' && o.en.length > 0 &&
  typeof o.zh === 'string' && o.zh.length > 0;

// 2. Interactives
console.log('\n[interactives]');
let interactives = [];
try { interactives = readJSON('data/interactives.json'); } catch (e) { bad('data/interactives.json parses: ' + e.message); }
check(Array.isArray(interactives) && interactives.length > 0, 'interactives is a non-empty array');

interactives.forEach((it) => {
  const id = it.id || '(missing id)';
  check(!!it.id, id + ': has id');
  check(isBilingual(it.title), id + ': bilingual title');
  check(isBilingual(it.subject), id + ': bilingual subject');
  check(isBilingual(it.intro), id + ': bilingual intro');
  check(Array.isArray(it.levels) && it.levels.length > 0, id + ': has levels');
  (it.levels || []).forEach((lv, i) => {
    check(isBilingual(lv.prompt), id + ' level ' + (i + 1) + ': bilingual prompt');
    check(isBilingual(lv.solution), id + ' level ' + (i + 1) + ': bilingual solution');
    check(Array.isArray(lv.hints) && lv.hints.length > 0, id + ' level ' + (i + 1) + ': has hints');
    (lv.hints || []).forEach((h, j) => {
      check(isBilingual(h), id + ' level ' + (i + 1) + ' hint ' + (j + 1) + ': bilingual');
    });
    check(lv.config && typeof lv.config.kind === 'string', id + ' level ' + (i + 1) + ': has config.kind');
  });
});

// 3. i18n key parity
console.log('\n[i18n]');
let i18n = null;
try { i18n = readJSON('data/i18n.json'); } catch (e) { bad('data/i18n.json parses: ' + e.message); }
if (i18n) {
  check(!!i18n.en && !!i18n.zh, 'i18n has en and zh');
  const enKeys = Object.keys(i18n.en || {}).sort();
  const zhKeys = Object.keys(i18n.zh || {}).sort();
  const missingZh = enKeys.filter((k) => !(k in (i18n.zh || {})));
  const missingEn = zhKeys.filter((k) => !(k in (i18n.en || {})));
  check(missingZh.length === 0, 'zh has all en keys' + (missingZh.length ? ' (missing: ' + missingZh.join(', ') + ')' : ''));
  check(missingEn.length === 0, 'en has all zh keys' + (missingEn.length ? ' (missing: ' + missingEn.join(', ') + ')' : ''));
}

// 4. Pages readiness
console.log('\n[pages]');
check(fs.existsSync(path.join(root, '.nojekyll')), 'exists: .nojekyll');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
check(!/src="\/assets/.test(html) && !/href="\/assets/.test(html), 'index.html uses relative asset paths');

console.log('\n' + (failures === 0 ? 'OK' : 'FAILED') + ' — ' + (checks - failures) + '/' + checks + ' checks passed');
process.exit(failures === 0 ? 0 : 1);
