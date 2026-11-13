// Çox oyunçulu (2–4) özü-özü ilə öyrətmə: TD(λ), hər oyunçunun öz gözü ilə "durak olmamaq" ehtimalı.
// Oyun növləri qarışıq: oyunçu sayı (ən çox 3–4), kart sayı 24/36/52, ötürmə, "kim atır".
// İstifadə: node trainn.js --minutes 330 --model models/durak_mp.json --log models/log_mp.txt
'use strict';
const fs = require('fs');
const { MLP } = require('./mlp.js'), { GameN } = require('./simn.js'), { featN, afterN, NF } = require('./featn.js');
const { nnBotN, ruleBotN, randomBotN, searchBotN } = require('./botsn.js'), { rng } = require('./arena.js');

const A = {}; process.argv.slice(2).forEach((a, i, v) => { if (a.startsWith('--')) A[a.slice(2)] = v[i + 1]; });
const MIN = +(A.minutes || 5), LR = +(A.lr || 0.0007), LAM = +(A.lambda || 0.7), EPS0 = +(A.eps || 0.08);
const PATH = A.model || 'models/durak_mp.json', LOG = A.log || 'models/log_mp.txt', EVAL = +(A.evalEvery || 5000), BATCH = 128;
// oyunçu sayı payları (2,3,4) və 4 nəfərlikdə "qonşular atır" payı — --pn 0.15,0.3,0.55 --nb4 0.75
const SNAP = +(A.snapEvery || 0), SNAPDIR = A.snapDir || 'snaps';
const FIRST = A.goal === 'first';   // --goal first: durak olmamaq yox, oyunda 1-ci olmaq üçün öyrən
// --search 0.1,6 : self-play-də qərarların 10%-ni axtarışla (6 paylama) seç — daha yaxşı gedişlərdən öyrənsin
const SRCH = A.search ? A.search.split(',').map(Number) : null;
// --pool a.json,b.json,rule --poolP 0.5 : masadakı yerlərin bir hissəsində köhnə modellər / qaydalı bot oturur (qarışıq rəqiblər);
//   öyrənən yalnız öz yerlərindən öyrənir (ən azı bir yer onundur)
const POOLP = +(A.poolP || 0.5);
const PNa = (A.pn || '0.2,0.4,0.4').split(',').map(Number), PN = { 2: PNa[0], 3: PNa[1], 4: PNa[2] }, NB4 = +(A.nb4 || 0.3);

let net, meta = { games: 0, samples: 0, hist: [], by: {} };
if (fs.existsSync(PATH)) { const j = JSON.parse(fs.readFileSync(PATH)); net = MLP.fromJSON(j.net); meta = Object.assign(meta, j.meta || {}); console.log('davam:', meta.games, 'oyun'); }
else net = new MLP([NF, 160, 80, 1], 11);

const rnd = rng((Date.now() ^ (meta.games * 7919)) >>> 0);
const POOL = A.pool ? A.pool.split(',').map((f) => f === 'rule' ? ruleBotN : nnBotN(MLP.fromJSON(JSON.parse(fs.readFileSync(f)).net), 0.02)) : null;
const SBOT = SRCH ? searchBotN(net, { K: SRCH[1] || 6, goal: FIRST ? 'first' : 'durak' }) : null;
if (POOL) console.log('qarışıq rəqiblər:', A.pool, 'pay', POOLP); if (SRCH) console.log('axtarış:', SRCH);
const buf = { X: [], T: [] };
const log = (s) => { console.log(s); fs.appendFileSync(LOG, new Date().toISOString().slice(0, 19) + ' ' + s + '\n'); };
// zəifliyə görə öyrətmə qarışığı (evaldet.js --mix yazır): { "4p24q": 0.06, "2p52t": 0.05, ... } — t: ötürməli, q: qonşular atır
const MIX = A.mix && fs.existsSync(A.mix) ? Object.entries(JSON.parse(fs.readFileSync(A.mix))) : null;
function pickMix() {
  let u = rnd() * MIX.reduce((a, x) => a + x[1], 0);
  for (const [k, w] of MIX) { u -= w; if (u <= 0) return k; }
  return MIX[MIX.length - 1][0];
}
function pickN() { const u = rnd(); return u < PN[2] ? 2 : u < PN[2] + PN[3] ? 3 : 4; }
function opts(n) { return { n, deckSize: [24, 36, 52][(rnd() * 3) | 0], trf: rnd() < 0.6, f5: true, nb: n === 4 ? rnd() < NB4 : n === 3 && rnd() < 0.3, rnd }; }

function selfPlay(eps) {
  let n, o;
  if (MIX) { const k = pickMix(), m = /^(\d)p(\d+)(t?)(q?)$/.exec(k); n = +m[1]; o = { n, deckSize: +m[2], trf: !!m[3], f5: true, nb: !!m[4], rnd }; }
  else { n = pickN(); o = opts(n); }
  const g = new GameN(o), bot = nnBotN(net, eps), tr = Array.from({ length: n }, () => []), x = new Float32Array(NF);
  // kim oturur: null — öyrənən, yoxsa hovuzdan rəqib
  const seat = Array.from({ length: n }, () => (POOL && rnd() < POOLP ? POOL[(rnd() * POOL.length) | 0] : null));
  if (seat.every((b) => b)) seat[(rnd() * n) | 0] = null;
  for (let k = 0; k < 4000; k++) {
    const info = g.legal(); if (!info) break;
    const p = info.p;
    if (seat[p]) { g.play(seat[p].pick(g, info, rnd)); continue; }
    const m = SBOT && info.M.length > 1 && rnd() < SRCH[0] && rnd() >= eps ? SBOT.pick(g, info, rnd) : bot.pick(g, info, rnd);
    const xs = featN(g, afterN(g, m, p), p, new Float32Array(NF));
    tr[p].push({ x: xs, v: net.forward(xs) });
    g.play(m);
  }
  if (!g.over()) return;
  for (let p = 0; p < n; p++) {
    if (seat[p]) continue;
    let G = FIRST ? g.scoreFirst(p) : g.score(p); const T = tr[p];
    for (let t = T.length - 1; t >= 0; t--) { const target = G; buf.X.push(T[t].x); buf.T.push(target); G = (1 - LAM) * T[t].v + LAM * target; }
  }
  const key = n + 'p' + o.deckSize; meta.by[key] = (meta.by[key] || 0) + 1;
  if (MIX) { const km = key + (o.trf ? 't' : '') + (o.nb ? 'q' : ''); meta.byMix = meta.byMix || {}; meta.byMix[km] = (meta.byMix[km] || 0) + 1; }
}

// yoxlama: neyron bir yerdə, qalanlar qaydalı — neyronun durak olma payı (bərabər güc: 1/n)
function evalVs(bot, n, games, seed) {
  const r = rng(seed); let dk = 0, done = 0;
  for (let i = 0; i < games; i++) {
    const o = { n, deckSize: [24, 36, 52][i % 3], trf: i % 2 === 0, f5: true, nb: false, rnd: r }, g = new GameN(o), seat = i % n;
    for (let k = 0; k < 4000; k++) { const info = g.legal(); if (!info) break; g.play((info.p === seat ? nnBotN(net, 0) : bot).pick(g, info, r)); }
    if (g.over()) { done++; if (FIRST ? g.scoreFirst(seat) > 0 : g.durak === seat) dk += FIRST ? g.scoreFirst(seat) : 1; }
  }
  return dk / Math.max(1, done);
}

if (MIX) log('zəifliyə görə qarışıq: ' + MIX.slice().sort((a, b) => b[1] - a[1]).map(([k, w]) => k + ' ' + (100 * w).toFixed(1) + '%').join(', '));
const t0 = Date.now(), end = t0 + MIN * 60000; let lossS = 0, lossN = 0, g0 = meta.games;
while (Date.now() < end) {
  const eps = Math.max(0.02, EPS0 * Math.pow(0.5, meta.games / 150000));
  selfPlay(eps); meta.games++;
  while (buf.X.length >= BATCH) {
    const idx = []; for (let i = 0; i < BATCH; i++) idx.push((rnd() * buf.X.length) | 0);
    const X = idx.map((i) => buf.X[i]), T = idx.map((i) => buf.T[i]);
    idx.sort((a, b) => b - a).forEach((i, k, arr) => { if (k && arr[k - 1] === i) return; buf.X[i] = buf.X[buf.X.length - 1]; buf.T[i] = buf.T[buf.T.length - 1]; buf.X.pop(); buf.T.pop(); });
    lossS += net.trainBatch(X, T, LR); lossN++; meta.samples += BATCH;
  }
  if (meta.games % EVAL === 0) {
    const d2 = evalVs(ruleBotN, 2, 150, meta.games), d3 = evalVs(ruleBotN, 3, 150, meta.games + 1), d4 = evalVs(ruleBotN, 4, 150, meta.games + 2);
    meta.hist.push({ g: meta.games, d2: +d2.toFixed(3), d3: +d3.toFixed(3), d4: +d4.toFixed(3) });
    if (FIRST) log(`oyun ${meta.games} · itki ${(lossS / Math.max(1, lossN)).toFixed(4)} · qaydalı botlara qarşı 1-ci olur: 2 nəfər ${(d2 * 100).toFixed(0)}% (bərabər 50), 3 nəfər ${(d3 * 100).toFixed(0)}% (33), 4 nəfər ${(d4 * 100).toFixed(0)}% (25) · ${((meta.games - g0) / ((Date.now() - t0) / 1000)).toFixed(1)} oyun/san`); else
    log(`oyun ${meta.games} · itki ${(lossS / Math.max(1, lossN)).toFixed(4)} · qaydalı botlara qarşı durak olur: 2 nəfər ${(d2 * 100).toFixed(0)}% (bərabər 50), 3 nəfər ${(d3 * 100).toFixed(0)}% (33), 4 nəfər ${(d4 * 100).toFixed(0)}% (25) · ${((meta.games - g0) / ((Date.now() - t0) / 1000)).toFixed(1)} oyun/san`);
    lossS = 0; lossN = 0;
    fs.writeFileSync(PATH, JSON.stringify({ net: net.toJSON(), meta }));
  }
  // ara nüsxələr: sonda ən yaxşısı seçilir (öyrənmə bir yerdə pisləşsə də, yaxşı an itmir)
  if (SNAP && meta.games % SNAP === 0) { fs.mkdirSync(SNAPDIR, { recursive: true }); fs.writeFileSync(SNAPDIR + '/snap_' + meta.games + '.json', JSON.stringify({ net: net.toJSON(), meta })); }
}
fs.writeFileSync(PATH, JSON.stringify({ net: net.toJSON(), meta }));
log(`bitdi: ${meta.games} oyun (${meta.games - g0} bu dəfə) · növlər: ${JSON.stringify(meta.by)}`);
