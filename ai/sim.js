// Durak simulyatoru (2 nəfər, ötürməli/ötürməsiz, 24 və ya 36 kart).
// Qaydalar tətbiqdəki dəqiq hesabla (web/solver.js) eynidir; üstəlik hər oyunçunun BİLDİKLƏRİ izlənir:
//   known[p] — p-nin rəqibin əlində olduğunu bildiyi kartlar (götürdüyü kartlar, dəstədən çəkdiyi açıq koz),
//   gone     — bitaya gedən kartlar (hamı görür).
// Kart: suit*13 + rank (rank 0=2 … 12=A), suit 0..3.
'use strict';
const S_ = (c) => (c / 13) | 0, R_ = (c) => c % 13;

function makeDeck(n) {
  const minR = n === 24 ? 7 : n === 36 ? 4 : 0, d = [];
  for (let s = 0; s < 4; s++) for (let r = minR; r <= 12; r++) d.push(s * 13 + r);
  return d;
}

class Game {
  // o: { deckSize: 24|36, trf: bool, f5: bool (ilk bita 5 kart), rnd: () => [0,1) }
  constructor(o) {
    this.o = o; const rnd = o.rnd || Math.random;
    const d = makeDeck(o.deckSize || 36);
    for (let i = d.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; const t = d[i]; d[i] = d[j]; d[j] = t; }
    // dəstənin sonu (d[0]) koz kartıdır, açıq durur; pop() ilə yuxarıdan çəkilir
    this.trumpCard = d[0]; this.TS = S_(d[0]);
    this.h = [[], []]; this.dk = d;
    for (let k = 0; k < 6; k++) for (let p = 0; p < 2; p++) this.h[p].push(this.dk.pop());
    this.tA = []; this.tD = []; this.tk = 0; this.fd = false;
    this.known = [new Set(), new Set()]; this.gone = new Set();
    // ilk hücum: ən kiçik kozu olan
    let best = 99, att = 0;
    for (let p = 0; p < 2; p++) for (const c of this.h[p]) if (S_(c) === this.TS && R_(c) < best) { best = R_(c); att = p; }
    this.att = att; this.moves = 0;
  }
  beats(d, a) { return S_(d) === S_(a) ? R_(d) > R_(a) : S_(d) === this.TS; }
  lim() { return this.o.f5 && !this.fd ? 5 : 6; }
  unb() { let u = 0; for (const x of this.tD) if (x < 0) u++; return u; }
  ranksOn(r) { for (const c of this.tA) if (R_(c) === r) return true; for (const c of this.tD) if (c >= 0 && R_(c) === r) return true; return false; }
  // növbəti hərəkət edən oyunçu və mümkün gedişlər
  legal() {
    const a = this.att, d = 1 - a, M = [];
    if (!this.tA.length) {
      for (const c of this.h[a]) M.push({ t: 'lead', cs: [c] });
      const maxN = Math.min(this.lim(), this.h[d].length), byR = {};
      for (const c of this.h[a]) (byR[R_(c)] = byR[R_(c)] || []).push(c);
      for (const k in byR) { const g = byR[k]; if (g.length < 2) continue;
        for (let m = 3; m < (1 << g.length); m++) { const cs = g.filter((_, i) => (m >> i) & 1); if (cs.length >= 2 && cs.length <= maxN) M.push({ t: 'lead', cs }); } }
      return { p: a, M };
    }
    if (!this.tk && this.unb() > 0) {
      this.tA.forEach((x, i) => { if (this.tD[i] >= 0) return; for (const c of this.h[d]) if (this.beats(c, x)) M.push({ t: 'cov', i, c }); });
      if (this.o.trf && this.tD.every((x) => x < 0)) {
        const r = R_(this.tA[0]);
        if (this.tA.every((x) => R_(x) === r)) {
          const g = this.h[d].filter((c) => R_(c) === r);
          for (let m = 1; m < (1 << g.length); m++) {
            const cs = g.filter((_, i) => (m >> i) & 1);
            if (this.tA.length + cs.length <= this.lim() && this.h[a].length >= this.tA.length + cs.length) M.push({ t: 'tr', cs });
          }
        }
      }
      M.push({ t: 'take' });
      return { p: d, M };
    }
    if (this.tA.length < this.lim() && this.unb() < this.h[d].length) for (const c of this.h[a]) if (this.ranksOn(R_(c))) M.push({ t: 'add', cs: [c] });
    M.push({ t: 'end' });
    return { p: a, M };
  }
  clone() {
    const g = Object.create(Game.prototype);
    g.o = this.o; g.trumpCard = this.trumpCard; g.TS = this.TS;
    g.h = [this.h[0].slice(), this.h[1].slice()]; g.dk = this.dk.slice(); g.tA = this.tA.slice(); g.tD = this.tD.slice();
    g.tk = this.tk; g.fd = this.fd; g.att = this.att; g.moves = this.moves;
    g.known = [new Set(this.known[0]), new Set(this.known[1])]; g.gone = new Set(this.gone);
    return g;
  }
  rm(p, cs) { this.h[p] = this.h[p].filter((x) => !cs.includes(x)); for (const c of cs) this.known[1 - p].delete(c); }
  play(m) {
    const a = this.att, d = 1 - a; this.moves++;
    if (m.t === 'lead' || m.t === 'add') { this.rm(a, m.cs); for (const c of m.cs) { this.tA.push(c); this.tD.push(-1); } }
    else if (m.t === 'cov') { this.rm(d, [m.c]); this.tD[m.i] = m.c; }
    else if (m.t === 'tr') { this.rm(d, m.cs); for (const c of m.cs) { this.tA.push(c); this.tD.push(-1); } this.att = d; }
    else if (m.t === 'take') this.tk = 1;
    else if (m.t === 'end') {
      const all = [...this.tA, ...this.tD.filter((x) => x >= 0)];
      if (this.tk) { for (const c of all) { this.h[d].push(c); this.known[a].add(c); } }   // götürən — rəqib bu kartları bilir
      else { for (const c of all) this.gone.add(c); this.fd = true; this.att = d; }
      this.tA = []; this.tD = []; this.tk = 0;
      for (const p of [a, d]) while (this.h[p].length < 6 && this.dk.length) {
        const c = this.dk.pop(); this.h[p].push(c);
        if (c === this.trumpCard) this.known[1 - p].add(c);   // açıq kozu çəkən — rəqib görür
      }
    }
  }
  // nəticə: -1 davam edir; 0.5 heç-heçə; 1 — oyunçu 0 udub; 0 — oyunçu 1 udub
  over() {
    if (this.tA.length || this.dk.length) return -1;
    const e0 = !this.h[0].length, e1 = !this.h[1].length;
    if (e0 && e1) return 0.5; if (e0) return 1; if (e1) return 0; return -1;
  }
}

module.exports = { Game, makeDeck, S_, R_ };
