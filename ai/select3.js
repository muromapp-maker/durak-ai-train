// Dəqiq seçim (1-ci olmaq üçün): 1-ci yoxlamada ən güclü 3 nüsxə başqa oyunlarla bir daha yoxlanılır, iki yoxlamanın ortasına görə ən güclüsü.
// node select3.js --round1 c1.res c2.res ... --top top.txt          → ən güclü 3-ün yolları (sətir-sətir)
// node select3.js --final a.res a2.res b.res b2.res ... --out best.txt --log log.txt --name firstv3a
'use strict';
const fs = require('fs');
const av = process.argv.slice(2), opt = (k) => { const i = av.indexOf(k); return i >= 0 ? av[i + 1] : null; };
const VAL = new Set(['--top', '--out', '--log', '--name']), files = av.filter((a, i) => !a.startsWith('--') && !(i > 0 && VAL.has(av[i - 1])));
const R = files.map((f) => JSON.parse(fs.readFileSync(f))), NS = ['2', '3', '4'];
const f = (r) => r.games + ' oyun: güc ' + r.score.toFixed(3) + ' (' + NS.map((n) => n + 'n 1-ci ' + (100 * r.per[n] / n).toFixed(1) + '%').join(', ') + ')';
const L = (m) => { console.log(m); if (opt('--log')) fs.appendFileSync(opt('--log'), new Date().toISOString().slice(0, 19) + ' ' + m + '\n'); };
if (av.includes('--round1')) {
  R.sort((a, b) => b.score - a.score);
  L((opt('--name') || '') + ' 1-ci yoxlama: ' + R.map(f).join(' | '));
  fs.writeFileSync(opt('--top'), R.slice(0, 3).map((r) => r.path).join('\n'));
} else {
  const by = {}; R.forEach((r) => { (by[r.path] = by[r.path] || []).push(r); });
  const avg = Object.values(by).map((a) => ({ path: a[0].path, games: a[0].games, score: a.reduce((s, r) => s + r.score, 0) / a.length, per: Object.fromEntries(NS.map((n) => [n, a.reduce((s, r) => s + r.per[n], 0) / a.length])) }));
  avg.sort((a, b) => b.score - a.score);
  L((opt('--name') || '') + ' seçim (2 yoxlamanın ortası): ' + avg.map(f).join(' | ') + ' → seçildi ' + avg[0].games + ' oyun');
  fs.writeFileSync(opt('--out'), avg[0].path);
}
