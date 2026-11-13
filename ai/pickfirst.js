// firstv1 üçün ən yaxşı nüsxənin seçimi (güc = 1-ci olma payı × n; çox = güclü).
// Əvvəl 2, 3, 4 nəfərin HƏR BİRİNDƏ başlanğıc modeldən (v4) güclü olanlar, onların arasında ən güclüsü.
// node pickfirst.js base.res c1.res c2.res ... --out best.txt --log log.txt
'use strict';
const fs = require('fs');
const av = process.argv.slice(2), opt = (k) => { const i = av.indexOf(k); return i >= 0 ? av[i + 1] : null; };
const VAL = new Set(['--out', '--log', '--name']), files = av.filter((a, i) => !a.startsWith('--') && !(i > 0 && VAL.has(av[i - 1])));
const R = files.map((f) => JSON.parse(fs.readFileSync(f))), base = R[0], c = R.slice(1), NS = ['2', '3', '4'];
const all = (x) => NS.every((n) => x.per[n] > base.per[n]);
c.sort((a, b) => (all(b) - all(a)) || b.score - a.score);
const f = (r) => r.games + ' oyun: güc ' + r.score.toFixed(3) + ' (' + NS.map((n) => n + 'n 1-ci ' + (100 * r.per[n] / n).toFixed(1) + '%').join(', ') + ')';
const m = (opt('--name') || 'firstv1') + ' seçimi: başlanğıc ' + f(base) + ' · ' + c.map((r) => f(r) + (all(r) ? ' ✓hamısı' : '')).join(' | ') + ' → seçildi: ' + c[0].games + ' oyun' + (all(c[0]) ? ' (hər oyunçu sayında güclü)' : ' (DİQQƏT: hamısında güclü deyil)');
console.log(m); if (opt('--log')) fs.appendFileSync(opt('--log'), new Date().toISOString().slice(0, 19) + ' ' + m + '\n');
// --strict: heç biri hər oyunçu sayında güclü deyilsə — başlanğıc model qalır (geriləmə olmasın)
const keep = av.includes('--strict') && !all(c[0]);
if (keep && opt('--log')) fs.appendFileSync(opt('--log'), new Date().toISOString().slice(0, 19) + ' → hamısında güclü nüsxə yoxdur, başlanğıc model saxlanıldı\n');
fs.writeFileSync(opt('--out'), keep ? base.path : c[0].path);
