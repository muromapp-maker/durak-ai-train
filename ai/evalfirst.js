// "1-ci olmaq" yoxlaması: hər oyun növü ayrıca (oyunçu sayı × kart sayı × ötürmə × 4 nəfərdə "kim atır").
// Neyron bir yerdə, qalanları qaydalı bot. Güc = 1-ci olma payı × n (1.00 = bərabər güc, çox = güclü).
// İstifadə: node evalfirst.js model.json [hər növdə oyun] [--seed 7] [--json out.res] [--log log.txt]
'use strict';
const fs = require('fs'), { MLP } = require('./mlp.js'), { GameN } = require('./simn.js'), { nnBotN, ruleBotN } = require('./botsn.js'), { rng } = require('./arena.js');
const av = process.argv.slice(2), opt = (k) => { const i = av.indexOf(k); return i >= 0 ? av[i + 1] : null; };
const SEED = +(opt('--seed') || 0), path = av[0], G = +(av[1] && !av[1].startsWith('--') ? av[1] : 2000);
const j = JSON.parse(fs.readFileSync(path)), nb = nnBotN(MLP.fromJSON(j.net), 0);
const kinds = [];
for (const n of [2, 3, 4]) for (const deck of [24, 36, 52]) for (const trf of [true, false]) for (const q of n === 4 ? [false, true] : [false]) kinds.push({ n, deck, trf, nb: q });
const key = (k) => k.n + 'p' + k.deck + (k.trf ? 't' : '') + (k.nb ? 'q' : '');
const res = [];
kinds.forEach((k, ki) => {
  const r = rng(9000 + ki * 17 + SEED); let fs1 = 0, dk = 0, done = 0;
  for (let i = 0; i < G; i++) {
    const g = new GameN({ n: k.n, deckSize: k.deck, trf: k.trf, f5: true, nb: k.nb, rnd: r }), seat = i % k.n;
    for (let t = 0; t < 4000; t++) { const info = g.legal(); if (!info) break; g.play((info.p === seat ? nb : ruleBotN).pick(g, info, r)); }
    if (g.over()) { done++; fs1 += g.scoreFirst(seat); if (g.durak === seat) dk++; }
  }
  res.push({ k, f: fs1 / done, d: dk / done });
});
const by = {}; res.forEach((x) => { (by[x.k.n] = by[x.k.n] || []).push(x); });
const per = {}, perD = {};
for (const n in by) { per[n] = by[n].reduce((a, x) => a + x.f * x.k.n, 0) / by[n].length; perD[n] = by[n].reduce((a, x) => a + x.d, 0) / by[n].length; }
const score = Object.values(per).reduce((a, b) => a + b, 0) / 3;
console.log(Object.keys(per).map((n) => `${n} nəfər: 1-ci ${(100 * per[n] / n).toFixed(1)}% (bərabər ${Math.round(100 / n)}%), durak ${(100 * perD[n]).toFixed(1)}%`).join(' · ') + ' · güc ' + score.toFixed(3));
if (opt('--json')) fs.writeFileSync(opt('--json'), JSON.stringify({ path, games: j.meta.games, score, per, perD, kinds: Object.fromEntries(res.map((x) => [key(x.k), +x.f.toFixed(4)])) }));
if (opt('--log')) fs.appendFileSync(opt('--log'), new Date().toISOString().slice(0, 19) + ` 1-ci olma yoxlaması (${j.meta.games} oyun, hər növdə ${G}): ` + Object.keys(per).map((n) => `${n}n 1-ci ${(100 * per[n] / n).toFixed(1)}% durak ${(100 * perD[n]).toFixed(1)}%`).join(' · ') + '\n');
