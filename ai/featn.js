// Çox oyunçulu oyunda gedişdən sonrakı vəziyyət (afterstate) və p oyunçusunun gözü ilə xüsusiyyətlər.
// Gediş edilir, amma dəstədən çəkmə hələ olmur (təsadüf hissəsi) — p görmədiyi kartları bilmir.
'use strict';
const { durakFeatN, NF } = require('./featncore.js');

// yüngül vəziyyət: g-nin lazımi sahələri (kopyalamadan)
function base(g) { return { h: g.h, tA: g.tA, tD: g.tD, att: g.att, def: g.def, tk: g.tk, fd: g.fd, nt: g.nt, add: null, kAdd: null, draw: false }; }

// s-də tur bitirsə (bita / götürmə) — nəticəni tətbiq et
function endAfter(g, s) {
  const d = s.def, all = s.tA.concat(s.tD.filter((x) => x >= 0)), h = s.h.slice();
  if (s.tk) { h[d] = h[d].concat(all); s.kAdd = { q: d, cs: all }; }
  else { s.add = all; s.fd = true; }
  s.h = h; s.tA = []; s.tD = []; s.draw = g.dk.length > 0;
  const act = (p) => s.h[p].length > 0 || g.dk.length > 0, N = g.N;
  const nx = (p) => { for (let k = 1; k <= N; k++) { const q = (p + k) % N; if (act(q)) return q; } return -1; };
  const a = s.tk ? nx(d) : (act(d) ? d : nx(d));
  s.att = a; s.def = a >= 0 ? nx(a) : -1; s.tk = 0; s.nt = 0;
  return s;
}
// s-də üstünə ata bilən varmı (g.thrower məntiqi, s-in kartları ilə)
function hasThrower(g, s) {
  const lim = g.o.f5 && !s.fd ? 5 : 6; let unb = 0; for (const x of s.tD) if (x < 0) unb++;
  if (s.tA.length >= lim || unb >= s.h[s.def].length) return false;
  const rs = new Set(); s.tA.forEach((c) => rs.add(c % 13)); s.tD.forEach((c) => { if (c >= 0) rs.add(c % 13); });
  for (let k = 0; k < g.N; k++) {
    const p = (s.att + k) % g.N;
    if (p === s.def || ((s.nt >> p) & 1) || !s.h[p].length) continue;
    if (g.o.nb && p !== s.att && p !== g.nextAct(s.def)) continue;
    if (s.h[p].some((c) => rs.has(c % 13))) return true;
  }
  return false;
}

function afterN(g, m, p) {
  const s = base(g), rmv = (q, cs) => { const h = s.h.slice(); h[q] = h[q].filter((x) => !cs.includes(x)); s.h = h; };
  if (m.t === 'lead' || m.t === 'add') { rmv(p, m.cs); s.tA = g.tA.concat(m.cs); s.tD = g.tD.concat(m.cs.map(() => -1)); s.nt = 0; }
  else if (m.t === 'cov') {
    rmv(g.def, [m.c]); s.tD = g.tD.slice(); s.tD[m.i] = m.c;
    if (s.tD.every((x) => x >= 0) && !hasThrower(g, s)) endAfter(g, s);   // son açıq kartı vurdu, atan yoxdur — bita
  }
  else if (m.t === 'tr') { rmv(g.def, m.cs); s.tA = g.tA.concat(m.cs); s.tD = g.tD.concat(m.cs.map(() => -1)); s.att = g.def; s.def = g.nextAct(g.def); s.nt = 0; }
  else if (m.t === 'take') { s.tk = 1; s.nt = 0; if (!hasThrower(g, s)) endAfter(g, s); }
  else if (m.t === 'pass') { s.nt = g.nt | (1 << p); if (!hasThrower(g, s)) endAfter(g, s); }
  return s;
}

// p-nin gözü ilə xüsusiyyətlər (s — afterN nəticəsi və ya null: hazırkı vəziyyət)
function featN(g, s, p, out) {
  s = s || base(g); const N = g.N, opp = [];
  for (let k = 1; k < N; k++) {
    const q = (p + k) % N, hq = s.h[q], kn = g.known[p][q];
    const known = hq.filter((c) => kn.has(c) || (s.kAdd && s.kAdd.q === q && s.kAdd.cs.includes(c)));
    opp.push({ n: hq.length, known, act: hq.length > 0 || g.dk.length > 0 });
  }
  const rel = (x) => (x < 0 ? -1 : (x - p + N) % N);
  return durakFeatN({ TS: g.TS, deckSize: g.o.deckSize || 36, nPl: N, my: s.h[p], gone: s.add ? [...g.gone, ...s.add] : [...g.gone], tA: s.tA, tD: s.tD,
    trumpCard: g.trumpCard, deck: g.dk.length, opp, attRel: rel(s.att), defRel: rel(s.def), tk: s.tk, fd: s.fd, trf: g.o.trf, nb: g.o.nb, draw: s.draw }, out);
}

module.exports = { afterN, featN, NF };
