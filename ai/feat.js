// Vəziyyətin kodlanması — yalnız p oyunçusunun GÖRDÜKLƏRİ (gizli kartlar yoxdur).
// Kart yuvası: rəng koz-a nisbətən (koz = 0), dəyər 6..A → 0..8; 36 yuva.
// "Gedişdən sonra" vəziyyəti (afterstate): gediş edilib, amma dəstədən çəkmə hələ olmayıb (təsadüf hissəsi).
'use strict';
const { S_, R_ } = require('./sim.js');
const NSLOT = 36, NF = NSLOT * 6 + 12;

const slot = (c, TS) => ((S_(c) - TS + 4) & 3) * 9 + (R_(c) - 4);

// gedişin nəticəsini yüngül şəkildə tətbiq et (Game-i kopyalamadan)
function after(g, m) {
  const a = g.att, d = 1 - a, s = { h: [g.h[0], g.h[1]], tA: g.tA, tD: g.tD, att: a, tk: g.tk, fd: g.fd, add: null, kAdd: null, draw: false };
  const rm = (h, cs) => h.filter((x) => !cs.includes(x));
  if (m.t === 'lead' || m.t === 'add') { s.h = a === 0 ? [rm(g.h[0], m.cs), g.h[1]] : [g.h[0], rm(g.h[1], m.cs)]; s.tA = g.tA.concat(m.cs); s.tD = g.tD.concat(m.cs.map(() => -1)); }
  else if (m.t === 'cov') { s.h = d === 0 ? [rm(g.h[0], [m.c]), g.h[1]] : [g.h[0], rm(g.h[1], [m.c])]; s.tD = g.tD.slice(); s.tD[m.i] = m.c; }
  else if (m.t === 'tr') { s.h = d === 0 ? [rm(g.h[0], m.cs), g.h[1]] : [g.h[0], rm(g.h[1], m.cs)]; s.tA = g.tA.concat(m.cs); s.tD = g.tD.concat(m.cs.map(() => -1)); s.att = d; }
  else if (m.t === 'take') s.tk = 1;
  else if (m.t === 'end') {
    const all = g.tA.concat(g.tD.filter((x) => x >= 0));
    if (g.tk) { s.h = d === 0 ? [g.h[0].concat(all), g.h[1]] : [g.h[0], g.h[1].concat(all)]; s.kAdd = { p: a, cs: all }; }
    else { s.add = all; s.fd = true; s.att = d; }
    s.tA = []; s.tD = []; s.tk = 0; s.draw = g.dk.length > 0;
  }
  return s;
}

// xüsusiyyət vektoru p üçün (g — oyun, s — after(g, m) və ya null: hazırkı vəziyyət) — ortaq kod featcore.js
const { durakFeat } = require('./featcore.js');
function feat(g, s, p, out) {
  s = s || { h: g.h, tA: g.tA, tD: g.tD, att: g.att, tk: g.tk, fd: g.fd, add: null, kAdd: null, draw: false };
  const op = s.h[1 - p], oppKnown = op.filter((c) => g.known[p].has(c) || (s.kAdd && s.kAdd.p === p && s.kAdd.cs.includes(c)));
  return durakFeat({ TS: g.TS, my: s.h[p], oppKnown, oppN: op.length, gone: s.add ? [...g.gone, ...s.add] : [...g.gone], tA: s.tA, tD: s.tD,
    iAtt: s.att === p, tk: s.tk, fd: s.fd, deck: g.dk.length, trumpCard: g.trumpCard, trf: g.o.trf, deckSize: g.o.deckSize || 36, draw: s.draw }, out);
}

module.exports = { feat, after, NF, NSLOT, slot };
