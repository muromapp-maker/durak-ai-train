// Arena: iki bot bir-birinə qarşı N oyun (yerlər növbə ilə dəyişir) — A-nın qələbə payı.
'use strict';
const { Game } = require('./sim.js');

function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

function playGame(bots, o, rnd) {
  const g = new Game({ ...o, rnd });
  for (let k = 0; k < 2000; k++) {
    const r = g.over(); if (r >= 0) return r;
    const info = g.legal(); g.play(bots[info.p].pick(g, info, rnd));
  }
  return 0.5;
}

function arena(A, B, n, o, seed) {
  const rnd = rng(seed || 12345); let w = 0;
  for (let i = 0; i < n; i++) {
    const oo = { deckSize: o.deckSize || (rnd() < 0.5 ? 24 : 36), trf: o.trf != null ? o.trf : rnd() < 0.5, f5: true };
    const aFirst = i % 2 === 0, r = playGame(aFirst ? [A, B] : [B, A], oo, rnd);
    w += aFirst ? r : 1 - r;
  }
  return w / n;
}

module.exports = { arena, playGame, rng };

if (require.main === module) {
  const { MLP } = require('./mlp.js'), { randomBot, ruleBot, nnBot } = require('./bots.js'), fs = require('fs');
  const n = +(process.argv[3] || 1000);
  const net = process.argv[2] && fs.existsSync(process.argv[2]) ? MLP.fromJSON(JSON.parse(fs.readFileSync(process.argv[2]))) : null;
  const t0 = Date.now();
  console.log('qaydalı vs təsadüfi:', arena(ruleBot, randomBot, n, {}).toFixed(3));
  if (net) {
    const nb = nnBot(net, 0);
    console.log('neyron vs təsadüfi:', arena(nb, randomBot, n, {}).toFixed(3));
    console.log('neyron vs qaydalı:', arena(nb, ruleBot, n, {}).toFixed(3));
  }
  console.log('vaxt', ((Date.now() - t0) / 1000).toFixed(1), 's');
}
