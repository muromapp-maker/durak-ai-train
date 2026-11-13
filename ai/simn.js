// Durak simulyatoru: 2–4 oyunçu, 24 (9–A), 36 (6–A) və ya 52 (2–A) kart, ötürməli / ötürməsiz,
// "kim atır": hamı və ya yalnız qonşular. Qaydalar tətbiqin mühərriki (web/engine.js) ilə eynidir:
//   • oyunçular oyun sırası ilə 0..N-1, növbəti — (p+1)%N (oyundan çıxanlar atlanır);
//   • hücum edən gəlir, vuran — ondan sonrakı; vurandan başqa hamı (və ya qonşular) üstünə ata bilər;
//   • ötürmə: vuran eyni dəyərli kartı qoyur, vurmaq növbəti oyunçuya keçir (onda kifayət qədər kart olmalıdır);
//   • tur bitəndə: götürüldüsə növbəti hücum vurandan sonrakınındır, bita olduqsa — vuranındır;
//   • çəkmə: hücum edəndən başlayaraq sıra ilə, vuran ən sonda; əli boşalan (dəstə də bitibsə) çıxır;
//   • son kartlı qalan — durak.
// Hər oyunçunun BİLDİKLƏRİ: known[p][q] — p-nin q-nün əlində olduğunu bildiyi kartlar (götürdükləri, açıq koz), gone — bita.
'use strict';
const S_ = (c) => (c / 13) | 0, R_ = (c) => c % 13;
const MINR = { 24: 7, 36: 4, 52: 0 };

function makeDeck(n) {
  const d = [], m = MINR[n] != null ? MINR[n] : 4;
  for (let s = 0; s < 4; s++) for (let r = m; r <= 12; r++) d.push(s * 13 + r);
  return d;
}

class GameN {
  // o: { n: 2..4, deckSize: 24|36|52, trf, f5, nb, rnd }
  constructor(o) {
    this.o = o; this.N = o.n || 2; const N = this.N, rnd = o.rnd || Math.random;
    const d = makeDeck(o.deckSize || 36);
    for (let i = d.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; const t = d[i]; d[i] = d[j]; d[j] = t; }
    this.trumpCard = d[0]; this.TS = S_(d[0]); this.dk = d;
    this.h = Array.from({ length: N }, () => []);
    for (let k = 0; k < 6; k++) for (let p = 0; p < N; p++) if (this.dk.length) this.h[p].push(this.dk.pop());
    this.tA = []; this.tD = []; this.tk = 0; this.fd = false; this.nt = 0;
    this.known = Array.from({ length: N }, () => Array.from({ length: N }, () => new Set()));
    this.gone = new Set();
    // dəstə paylanmada bitibsə (4×6=24) açıq koz kimdədirsə hamı bilir
    if (!this.dk.length) for (let p = 0; p < N; p++) if (this.h[p].includes(this.trumpCard)) for (let q = 0; q < N; q++) if (q !== p) this.known[q][p].add(this.trumpCard);
    let best = 99, att = 0;
    for (let p = 0; p < N; p++) for (const c of this.h[p]) if (S_(c) === this.TS && R_(c) < best) { best = R_(c); att = p; }
    this.att = att; this.att0 = att; this.def = this.nextAct(att);
    this.durak = null; this.moves = 0; this.cur = -1; this.first = null;   // first: oyundan ilk çıxan(lar)
  }
  active(p) { return this.h[p].length > 0 || this.dk.length > 0; }
  nextAct(p) { for (let k = 1; k <= this.N; k++) { const q = (p + k) % this.N; if (this.active(q)) return q; } return -1; }
  beats(d, a) { return S_(d) === S_(a) ? R_(d) > R_(a) : S_(d) === this.TS; }
  lim() { return this.o.f5 && !this.fd ? 5 : 6; }
  unb() { let u = 0; for (const x of this.tD) if (x < 0) u++; return u; }
  ranksOn(r) { for (const c of this.tA) if (R_(c) === r) return true; for (const c of this.tD) if (c >= 0 && R_(c) === r) return true; return false; }
  canAdd() { return this.tA.length < this.lim() && this.unb() < this.h[this.def].length; }
  // üstünə ata bilən növbəti oyunçu (yoxdursa -1)
  thrower(nt) {
    nt = nt == null ? this.nt : nt;
    if (!this.canAdd()) return -1;
    for (let k = 0; k < this.N; k++) {
      const p = (this.att + k) % this.N;
      if (p === this.def || ((nt >> p) & 1) || !this.h[p].length) continue;
      if (this.o.nb && p !== this.att && p !== this.nextAct(this.def)) continue;
      if (this.h[p].some((c) => this.ranksOn(R_(c)))) return p;
    }
    return -1;
  }
  over() { return this.durak !== null; }
  // növbəti qərar verən oyunçu və gedişləri; qərar yoxdursa turu özü bağlayır. Oyun bitibsə null.
  legal() {
    for (let guard = 0; guard < 50; guard++) {
      if (this.durak !== null) return null;
      const a = this.att, d = this.def, M = [];
      if (!this.tA.length) {
        if (!this.h[a].length) { this.att = this.nextAct(a); this.att0 = this.att; this.def = this.nextAct(this.att); continue; }
        for (const c of this.h[a]) M.push({ t: 'lead', cs: [c] });
        const maxN = Math.min(this.lim(), this.h[d].length), byR = {};
        for (const c of this.h[a]) (byR[R_(c)] = byR[R_(c)] || []).push(c);
        for (const k in byR) { const g = byR[k]; if (g.length < 2) continue;
          for (let m = 3; m < (1 << g.length); m++) { const cs = g.filter((_, i) => (m >> i) & 1); if (cs.length >= 2 && cs.length <= maxN) M.push({ t: 'lead', cs }); } }
        this.cur = a; return { p: a, M };
      }
      if (!this.tk && this.unb() > 0) {
        this.tA.forEach((x, i) => { if (this.tD[i] >= 0) return; for (const c of this.h[d]) if (this.beats(c, x)) M.push({ t: 'cov', i, c }); });
        if (this.o.trf && this.tD.every((x) => x < 0)) {
          const r = R_(this.tA[0]), nd = this.nextAct(d);
          if (nd >= 0 && nd !== d && this.tA.every((x) => R_(x) === r)) {
            const g = this.h[d].filter((c) => R_(c) === r);
            for (let m = 1; m < (1 << g.length); m++) {
              const cs = g.filter((_, i) => (m >> i) & 1);
              if (this.tA.length + cs.length <= this.lim() && this.h[nd].length >= this.tA.length + cs.length) M.push({ t: 'tr', cs });
            }
          }
        }
        M.push({ t: 'take' });
        this.cur = d; return { p: d, M };
      }
      const p = this.thrower();
      if (p >= 0) {
        for (const c of this.h[p]) if (this.ranksOn(R_(c))) M.push({ t: 'add', cs: [c] });
        M.push({ t: 'pass' });
        this.cur = p; return { p, M };
      }
      this.endTurn();
    }
    return null;
  }
  rm(p, cs) {
    this.h[p] = this.h[p].filter((x) => !cs.includes(x));
    for (let q = 0; q < this.N; q++) for (const c of cs) this.known[q][p].delete(c);
  }
  play(m) {
    const p = this.cur, d = this.def; this.moves++;
    if (m.t === 'lead' || m.t === 'add') { this.rm(p, m.cs); for (const c of m.cs) { this.tA.push(c); this.tD.push(-1); } this.nt = 0; }
    else if (m.t === 'cov') { this.rm(d, [m.c]); this.tD[m.i] = m.c; }
    else if (m.t === 'tr') { this.rm(d, m.cs); for (const c of m.cs) { this.tA.push(c); this.tD.push(-1); } this.att = d; this.att0 = d; this.def = this.nextAct(d); this.nt = 0; }
    else if (m.t === 'take') { this.tk = 1; this.nt = 0; }
    else if (m.t === 'pass') this.nt |= 1 << p;
  }
  draw(p) {
    while (this.h[p].length < 6 && this.dk.length) {
      const c = this.dk.pop(); this.h[p].push(c);
      if (c === this.trumpCard) for (let q = 0; q < this.N; q++) if (q !== p) this.known[q][p].add(c);   // açıq kozu çəkəni hamı görür
    }
  }
  endTurn() {
    const d = this.def, took = !!this.tk, all = this.tA.concat(this.tD.filter((x) => x >= 0));
    if (took) { for (const c of all) { this.h[d].push(c); for (let q = 0; q < this.N; q++) if (q !== d) this.known[q][d].add(c); } }
    else { for (const c of all) this.gone.add(c); this.fd = true; }
    this.tA = []; this.tD = []; this.tk = 0; this.nt = 0;
    for (let k = 0; k < this.N; k++) { const p = (this.att0 + k) % this.N; if (p !== d) this.draw(p); }
    this.draw(d);
    let cnt = 0, last = -1; for (let p = 0; p < this.N; p++) if (this.active(p)) { cnt++; last = p; }
    if (!this.first) { const out = []; for (let p = 0; p < this.N; p++) if (!this.active(p)) out.push(p); if (out.length) this.first = out; }
    if (cnt <= 1) { this.durak = cnt === 1 ? last : -1; return; }
    const a = took ? this.nextAct(d) : (this.active(d) ? d : this.nextAct(d));
    this.att = a; this.att0 = a; this.def = this.nextAct(a);
  }
  // p üçün nəticə: durak — 0, durak deyil — 1, heç-heçə (hamı birdən çıxdı) — 0.5
  score(p) { return this.durak === p ? 0 : this.durak < 0 ? 0.5 : 1; }
  // p üçün "1-ci olmaq" nəticəsi: tək 1-cidirsə 1, eyni anda bir neçə nəfər çıxıbsa bölünür, yoxsa 0
  scoreFirst(p) { const f = this.first || []; return f.includes(p) ? 1 / f.length : 0; }
}

module.exports = { GameN, makeDeck, S_, R_, MINR };
