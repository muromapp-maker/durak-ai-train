// Öyrətmədən sonra ən güclü modelin seçimi (az bal = güclü; bal = 2, 3, 4 nəfərin orta zəifliklərinin ortası).
// GERİLƏMƏ OLMASIN: yeni model yalnız 2, 3 və 4 nəfərin HƏR BİRİNDƏ əsasdan güclüdürsə (zəifliyi azdırsa)
// və ümumi bal ən azı MARGIN qədər yaxşıdırsa götürülür; biri belə zəifləyibsə — əsas model qalır.
// 1) node pick.js --choose base.res c1.res c2.res ... --bestOut best.txt  → ən yaxşı namizədin yolu
// 2) node pick.js --final base.res best.res base2.res best2.res --base base.json --out models/durak_mp.json --log models/log_mp.txt
//    (2-ci yoxlama başqa oyunlarla: təsadüfi şans seçimə təsir etməsin; qərar iki yoxlamanın ortasına görədir)
'use strict';
const fs = require('fs');
const av = process.argv.slice(2), opt = (k) => { const i = av.indexOf(k); return i >= 0 ? av[i + 1] : null; };
const VAL = new Set(['--bestOut', '--base', '--out', '--log', '--margin', '--decision']);
const files = av.filter((a, i) => !a.startsWith('--') && !(i > 0 && VAL.has(av[i - 1])));
const R = files.map((f) => JSON.parse(fs.readFileSync(f)));
const MARGIN = +(opt('--margin') || 0.006), NS = ['2', '3', '4'];
const f = (r) => r.games + ' oyun: bal ' + r.score.toFixed(3) + ' (2n ' + r.per[2].toFixed(3) + ', 3n ' + r.per[3].toFixed(3) + ', 4n ' + r.per[4].toFixed(3) + ')';
const L = (m) => { console.log(m); if (opt('--log')) fs.appendFileSync(opt('--log'), new Date().toISOString().slice(0, 19) + ' ' + m + '\n'); };
const allBetter = (c, b) => NS.every((n) => c.per[n] < b.per[n]);
if (av.includes('--choose')) {
  const base = R[0], c = R.slice(1);
  // əvvəl hər oyunçu sayında əsasdan güclü olanlar, onların arasında ən az bal
  c.sort((a, b) => (allBetter(b, base) - allBetter(a, base)) || a.score - b.score);
  L('ara nüsxələr (1-ci yoxlama): əsas ' + f(base) + ' · ' + c.map((r) => f(r) + (allBetter(r, base) ? ' ✓hamısı' : '')).join(' | '));
  fs.writeFileSync(opt('--bestOut'), c[0].path);
} else {
  const [b1, c1, b2, c2] = R, avg = (x, y) => ({ score: (x.score + y.score) / 2, per: Object.fromEntries(NS.map((n) => [n, (x.per[n] + y.per[n]) / 2])) });
  const B = avg(b1, b2), C = avg(c1, c2), ok = allBetter(C, B) && C.score <= B.score - MARGIN;
  const ps = (X) => NS.map((n) => n + 'n ' + X.per[n].toFixed(3)).join(', ');
  let msg = 'seçim (2 yoxlamanın ortası): əsas ' + b1.games + ' oyun bal ' + B.score.toFixed(3) + ' (' + ps(B) + ') · ən yaxşı nüsxə ' + c1.games + ' oyun bal ' + C.score.toFixed(3) + ' (' + ps(C) + ')';
  if (ok) { fs.copyFileSync(c1.path, opt('--out')); msg += ' → YENİ model götürüldü (hər oyunçu sayında güclüdür)'; }
  else { fs.copyFileSync(opt('--base'), opt('--out')); msg += ' → ' + (allBetter(C, B) ? 'ümumi fərq azdır' : 'bəzi oyunçu sayında zəifləyib') + ', əsas model saxlanıldı'; }
  L(msg);
  if (opt('--decision')) fs.writeFileSync(opt('--decision'), ok ? 'new' : 'old');
}
