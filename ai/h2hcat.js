// Bir oyunçu sayında (n), yalnız 24/36 kartda: A bir yerdə, B qalan yerlərdə. Növ üzrə A-nın durak payı.
// İstifadə: node h2hcat.js A.json B.json n [hər növdə oyun] [--seed 1] [--name "..."] [--out fayl]
'use strict';
const fs = require('fs'), { MLP } = require('./mlp.js'), { GameN } = require('./simn.js'), { nnBotN } = require('./botsn.js'), { rng } = require('./arena.js');
const av = process.argv.slice(2), opt = (k) => { const i = av.indexOf(k); return i >= 0 ? av[i + 1] : null; };
const load = (p) => nnBotN(MLP.fromJSON(JSON.parse(fs.readFileSync(p)).net), 0);
const A = load(av[0]), B = load(av[1]), n = +av[2], G = +(av[3] && !av[3].startsWith('--') ? av[3] : 1000), SEED = +(opt('--seed') || 0);
let d = 0, done = 0, ki = 0; const parts = [];
for (const deck of [24, 36]) {
  let dd = 0, dn = 0;
  for (const trf of [true, false]) for (const q of n === 4 ? [false, true] : [false]) {
    const r = rng(9000 + n * 100 + ki++ * 17 + SEED);
    for (let i = 0; i < G; i++) {
      const g = new GameN({ n, deckSize: deck, trf, f5: true, nb: q, rnd: r }), seat = i % n;
      for (let t = 0; t < 4000; t++) { const info = g.legal(); if (!info) break; g.play(((info.p === seat) ? A : B).pick(g, info, r)); }
      if (g.over()) { dn++; if (g.durak === seat) dd++; }
    }
  }
  d += dd; done += dn; parts.push(`${deck} kart ${(100 * dd / dn).toFixed(1)}%`);
}
const line = `${opt('--name') || av[0] + ' vs ' + av[1]} [${n} nəfər, bərabər ${(100 / n).toFixed(1)}%]: durak ${(100 * d / done).toFixed(1)}% (${parts.join(', ')})`;
console.log(line); if (opt('--out')) fs.appendFileSync(opt('--out'), line + '\n');
