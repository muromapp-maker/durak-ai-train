// Model A bir yerdə, qalan yerlərdə model B (və ya "rule" — qaydalı bot). Hər oyun növündə A-nın 1-ci olma və durak olma payı.
// İstifadə: node h2h.js A.json B.json|rule [hər növdə oyun] [--seed 1] [--name "firstv1 vs v4"] [--out fayl]
'use strict';
const fs = require('fs'), { MLP } = require('./mlp.js'), { GameN } = require('./simn.js'), { nnBotN, ruleBotN } = require('./botsn.js'), { rng } = require('./arena.js');
const av = process.argv.slice(2), opt = (k) => { const i = av.indexOf(k); return i >= 0 ? av[i + 1] : null; };
const load = (p) => p === 'rule' ? ruleBotN : nnBotN(MLP.fromJSON(JSON.parse(fs.readFileSync(p)).net), 0);
const A = load(av[0]), B = load(av[1]), G = +(av[2] && !av[2].startsWith('--') ? av[2] : 1000), SEED = +(opt('--seed') || 0);
const out = [];
for (const n of [2, 3, 4]) {
  let f = 0, d = 0, done = 0, ki = 0;
  for (const deck of [24, 36, 52]) for (const trf of [true, false]) for (const q of n === 4 ? [false, true] : [false]) {
    const r = rng(12000 + n * 100 + ki++ * 17 + SEED);
    for (let i = 0; i < G; i++) {
      const g = new GameN({ n, deckSize: deck, trf, f5: true, nb: q, rnd: r }), seat = i % n;
      for (let t = 0; t < 4000; t++) { const info = g.legal(); if (!info) break; g.play((info.p === seat ? A : B).pick(g, info, r)); }
      if (g.over()) { done++; f += g.scoreFirst(seat); if (g.durak === seat) d++; }
    }
  }
  out.push(`${n} nəfər: 1-ci ${(100 * f / done).toFixed(1)}% (bərabər ${Math.round(100 / n)}%), durak ${(100 * d / done).toFixed(1)}%`);
}
const line = (opt('--name') || (av[0] + ' vs ' + av[1])) + ': ' + out.join(' · ');
console.log(line); if (opt('--out')) fs.appendFileSync(opt('--out'), line + '\n');
