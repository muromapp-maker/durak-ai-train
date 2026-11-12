// Ətraflı yoxlama: hər oyun növü ayrıca (oyunçu sayı × kart sayı × ötürmə var/yox × 4 nəfərdə "kim atır").
// Neyron bir yerdə, qalanları qaydalı bot. Zəiflik = durak olma payı / bərabər güc payı (1/n).
// İstifadə: node evaldet.js models/durak_mp.json [hər növdə oyun] [--mix models/mix_mp.json] [--log models/log_mp.txt]
'use strict';
const fs = require('fs'), { MLP } = require('./mlp.js'), { GameN } = require('./simn.js'), { nnBotN, ruleBotN } = require('./botsn.js'), { rng } = require('./arena.js');
const av = process.argv.slice(2), opt = (k) => { const i = av.indexOf(k); return i >= 0 ? av[i + 1] : null; };
const SEED = +(opt('--seed') || 0), path = av[0] || 'models/durak_mp.json', G = +(av[1] && !av[1].startsWith('--') ? av[1] : 2000);
const j = JSON.parse(fs.readFileSync(path)), net = MLP.fromJSON(j.net), nb = nnBotN(net, 0);
const kinds = [];
for (const n of [2, 3, 4]) for (const deck of [24, 36, 52]) for (const trf of [true, false]) for (const q of n === 4 ? [false, true] : [false]) kinds.push({ n, deck, trf, nb: q });
const key = (k) => k.n + 'p' + k.deck + (k.trf ? 't' : '') + (k.nb ? 'q' : '');
const name = (k) => k.n + ' nəfər ' + k.deck + ' kart, ' + (k.trf ? 'ötürməli' : 'ötürməsiz') + (k.n === 4 ? (k.nb ? ', qonşular' : ', hamı atır') : '');
const res = [];
kinds.forEach((k, ki) => {
  const r = rng(5000 + ki * 17 + SEED); let dk = 0, done = 0;
  for (let i = 0; i < G; i++) {
    const g = new GameN({ n: k.n, deckSize: k.deck, trf: k.trf, f5: true, nb: k.nb, rnd: r }), seat = i % k.n;
    for (let t = 0; t < 4000; t++) { const info = g.legal(); if (!info) break; g.play((info.p === seat ? nb : ruleBotN).pick(g, info, r)); }
    if (g.over()) { done++; if (g.durak === seat) dk++; }
  }
  const p = dk / done; res.push({ k, p, weak: p * k.n });
});
const lines = res.map((x) => `${name(x.k)}: durak ${(100 * x.p).toFixed(1)}% (bərabər ${Math.round(100 / x.k.n)}%) · zəiflik ${x.weak.toFixed(2)}`);
console.log(lines.join('\n'));
// ötürməli / ötürməsiz cəmi
for (const t of [true, false]) { const s = res.filter((x) => x.k.trf === t); console.log((t ? 'ötürməli' : 'ötürməsiz') + ' orta zəiflik: ' + (s.reduce((a, x) => a + x.weak, 0) / s.length).toFixed(2)); }
if (opt('--log')) fs.appendFileSync(opt('--log'), new Date().toISOString().slice(0, 19) + ` ətraflı yoxlama (${j.meta.games} oyun, hər növdə ${G}): ` + res.map((x) => key(x.k) + ' ' + (100 * x.p).toFixed(1) + '%').join(' · ') + '\n');
// öyrətmə qarışığı: zəif növə çox, güclüyə az (pay ~ zəiflik², ən azı 1.5%)
if (opt('--mix')) {
  const w = res.map((x) => Math.pow(x.weak, 2)), s = w.reduce((a, b) => a + b, 0), mix = {};
  res.forEach((x, i) => { mix[key(x.k)] = w[i] / s; });
  const fl = 0.015; let s2 = 0; for (const k in mix) { mix[k] = Math.max(fl, mix[k]); s2 += mix[k]; }
  for (const k in mix) mix[k] = +(mix[k] / s2).toFixed(4);
  fs.writeFileSync(opt('--mix'), JSON.stringify(mix, null, 1) + '\n');
  console.log('qarışıq:', Object.entries(mix).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + (100 * v).toFixed(1) + '%').join(', '));
}
// müqayisə üçün bir rəqəm: hər oyunçu sayının orta zəifliyi, sonra onların ortası (2, 3, 4 nəfər bərabər çəkidə)
if (opt('--json')) {
  const by = {}; res.forEach((x) => { (by[x.k.n] = by[x.k.n] || []).push(x.weak); });
  const per = Object.fromEntries(Object.entries(by).map(([n, a]) => [n, a.reduce((p, q) => p + q, 0) / a.length]));
  const score = Object.values(per).reduce((a, b) => a + b, 0) / Object.keys(per).length;
  fs.writeFileSync(opt('--json'), JSON.stringify({ path, games: j.meta.games, score, per, kinds: Object.fromEntries(res.map((x) => [key(x.k), +x.p.toFixed(4)])) }));
}
