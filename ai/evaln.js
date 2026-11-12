// Çox oyunçulu modelin yoxlanması: neyron bir yerdə, qalanları qaydalı bot — neyronun durak olma payı.
// İstifadə: node evaln.js models/durak_mp.json [oyun sayı] [jurnal]
'use strict';
const fs = require('fs'), { MLP } = require('./mlp.js'), { GameN } = require('./simn.js'), { nnBotN, ruleBotN } = require('./botsn.js'), { rng } = require('./arena.js');
const j = JSON.parse(fs.readFileSync(process.argv[2] || 'models/durak_mp.json')), net = MLP.fromJSON(j.net), G = +(process.argv[3] || 300), t0 = Date.now();
const parts = [];
for (const n of [2, 3, 4]) {
  const r = rng(1000 + n); let dk = 0, done = 0;
  for (let i = 0; i < G; i++) {
    const g = new GameN({ n, deckSize: [24, 36, 52][i % 3], trf: i % 2 === 0, f5: true, nb: false, rnd: r }), seat = i % n, nb = nnBotN(net, 0);
    for (let k = 0; k < 4000; k++) { const info = g.legal(); if (!info) break; g.play((info.p === seat ? nb : ruleBotN).pick(g, info, r)); }
    if (g.over()) { done++; if (g.durak === seat) dk++; }
  }
  parts.push(`${n} nəfər: durak olur ${(100 * dk / done).toFixed(1)}% (bərabər ${Math.round(100 / n)}%)`);
}
const line = `yoxlama (${j.meta.games} oyun öyrədilib, qaydalı botlara qarşı, hər növdə ${G} oyun): ` + parts.join(' · ') + ` · ${((Date.now() - t0) / 1000).toFixed(0)} san`;
console.log(line);
if (process.argv[4]) fs.appendFileSync(process.argv[4], new Date().toISOString().slice(0, 19) + ' ' + line + '\n');
