// Modellər bir-birinə qarşı (eyni masada): hər oyunda yerlər təsadüfi qarışdırılır.
// node match.js --n 3 --deck 36 --lineup v4,f1,v4 --mode pure|hyb --minutes 110 --out res.json
//   f1 — firstv1; mode hyb: firstv1 yalnız 3+ nəfərdə və hələ heç kim çıxmayıbsa oynayır, sonra v4 (tətbiqdəki kimi)
'use strict';
const fs = require('fs'), { MLP } = require('./mlp.js'), { GameN } = require('./simn.js'), { nnBotN } = require('./botsn.js'), { rng } = require('./arena.js');
const A = {}; process.argv.slice(2).forEach((a, i, v) => { if (a.startsWith('--')) A[a.slice(2)] = v[i + 1]; });
const n = +A.n, deck = +A.deck, lineup = A.lineup.split(','), mode = A.mode || 'pure', MIN = +(A.minutes || 1), out = A.out;
const net = (p) => nnBotN(MLP.fromJSON(JSON.parse(fs.readFileSync(p)).net), 0);
const v4 = net('models/v4.json'), f1 = net('models/first_v1.json');
const hyb = { pick(g, info, r) { return (n >= 3 && !g.first ? f1 : v4).pick(g, info, r); } };
const bot = (k) => k === 'v4' ? v4 : mode === 'hyb' ? hyb : f1;
const r = rng((Date.now() ^ (n * 1000 + deck)) >>> 0), t0 = Date.now(), end = t0 + MIN * 60000;
const S = {}; for (const k of new Set(lineup)) S[k] = { seats: 0, first: 0, notDurak: 0 };
let games = 0, draws = 0;
const save = () => fs.writeFileSync(out, JSON.stringify({ n, deck, lineup: lineup.join(','), mode, games, draws, S, min: +((Date.now() - t0) / 60000).toFixed(1) }));
while (Date.now() < end) {
  for (let b = 0; b < 200; b++) {
    const seat = lineup.slice(); for (let i = seat.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0; [seat[i], seat[j]] = [seat[j], seat[i]]; }
    const g = new GameN({ n, deckSize: deck, trf: r() < 0.5, f5: true, nb: n === 4 ? r() < 0.5 : false, rnd: r });
    for (let t = 0; t < 4000; t++) { const info = g.legal(); if (!info) break; g.play(bot(seat[info.p]).pick(g, info, r)); }
    if (!g.over()) continue;
    games++; if (g.durak < 0) draws++;
    seat.forEach((k, p) => { const s = S[k]; s.seats++; s.first += g.scoreFirst(p); if (g.durak !== p) s.notDurak++; });
  }
  if (games % 20000 < 200) save();
}
save(); console.log(JSON.stringify(JSON.parse(fs.readFileSync(out))));
