// Kiçik neyron şəbəkə (çox qatlı perseptron): ReLU gizli qatlar, sigmoid çıxış (udma ehtimalı).
// Öyrətmə: ikili çarpaz entropiya + Adam. Asılılıqsız, sırf JS — telefonda da eyni kod işləyir.
'use strict';
class MLP {
  constructor(sizes, seed) {
    this.sizes = sizes; this.W = []; this.b = [];
    let s = seed || 1; const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    for (let l = 0; l < sizes.length - 1; l++) {
      const n = sizes[l], m = sizes[l + 1], w = new Float32Array(n * m), sd = Math.sqrt(2 / n);
      for (let i = 0; i < w.length; i++) { const u = rnd() || 1e-9, v = rnd(); w[i] = sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
      this.W.push(w); this.b.push(new Float32Array(m));
    }
    this.acts = sizes.map((n) => new Float32Array(n));
  }
  // irəli keçid: udma ehtimalı
  forward(x) {
    const L = this.W.length; this.acts[0] = x;
    for (let l = 0; l < L; l++) {
      const n = this.sizes[l], m = this.sizes[l + 1], W = this.W[l], b = this.b[l], a = this.acts[l], z = this.acts[l + 1];
      for (let j = 0; j < m; j++) z[j] = b[j];
      for (let i = 0; i < n; i++) { const ai = a[i]; if (ai === 0) continue; const off = i * m; for (let j = 0; j < m; j++) z[j] += ai * W[off + j]; }
      if (l < L - 1) for (let j = 0; j < m; j++) { if (z[j] < 0) z[j] = 0; }
    }
    const zl = this.acts[L][0]; return 1 / (1 + Math.exp(-zl));
  }
  initAdam() {
    this.mW = this.W.map((w) => new Float32Array(w.length)); this.vW = this.W.map((w) => new Float32Array(w.length));
    this.mb = this.b.map((w) => new Float32Array(w.length)); this.vb = this.b.map((w) => new Float32Array(w.length));
    this.gW = this.W.map((w) => new Float32Array(w.length)); this.gb = this.b.map((w) => new Float32Array(w.length)); this.t = 0;
  }
  // bir mini-dəstə: X — Float32Array massivi, T — hədəflər (0..1)
  trainBatch(X, T, lr) {
    if (!this.mW) this.initAdam();
    const L = this.W.length; this.gW.forEach((g) => g.fill(0)); this.gb.forEach((g) => g.fill(0));
    const delta = this.sizes.map((n) => new Float32Array(n)); let loss = 0;
    for (let k = 0; k < X.length; k++) {
      const y = this.forward(X[k]), t = T[k];
      loss += -(t * Math.log(y + 1e-7) + (1 - t) * Math.log(1 - y + 1e-7));
      delta[L][0] = y - t;
      for (let l = L - 1; l >= 0; l--) {
        const n = this.sizes[l], m = this.sizes[l + 1], W = this.W[l], a = this.acts[l], dz = delta[l + 1], gW = this.gW[l], gb = this.gb[l], da = delta[l];
        for (let j = 0; j < m; j++) gb[j] += dz[j];
        if (l === 0) {   // giriş qatı: yalnız sıfır olmayan girişlər (kodlama seyrəkdir), girişin törəməsi lazım deyil
          for (let i = 0; i < n; i++) { const ai = a[i]; if (ai === 0) continue; const off = i * m; for (let j = 0; j < m; j++) gW[off + j] += ai * dz[j]; }
          continue;
        }
        for (let i = 0; i < n; i++) {
          const ai = a[i], off = i * m; let s = 0;
          for (let j = 0; j < m; j++) { if (ai !== 0) gW[off + j] += ai * dz[j]; s += W[off + j] * dz[j]; }
          da[i] = ai > 0 ? s : 0;   // ReLU törəməsi
        }
      }
    }
    this.t++; const b1 = 0.9, b2 = 0.999, eps = 1e-8, B = X.length, c1 = 1 - Math.pow(b1, this.t), c2 = 1 - Math.pow(b2, this.t);
    const upd = (P, G, M, V) => { for (let i = 0; i < P.length; i++) { const g = G[i] / B; M[i] = b1 * M[i] + (1 - b1) * g; V[i] = b2 * V[i] + (1 - b2) * g * g; P[i] -= lr * (M[i] / c1) / (Math.sqrt(V[i] / c2) + eps); } };
    for (let l = 0; l < L; l++) { upd(this.W[l], this.gW[l], this.mW[l], this.vW[l]); upd(this.b[l], this.gb[l], this.mb[l], this.vb[l]); }
    return loss / B;
  }
  toJSON() { const r = (a) => Array.from(a, (v) => Math.round(v * 1e5) / 1e5); return { sizes: this.sizes, W: this.W.map(r), b: this.b.map(r) }; }
  static fromJSON(j) { const m = new MLP(j.sizes, 1); m.W = j.W.map((w) => Float32Array.from(w)); m.b = j.b.map((w) => Float32Array.from(w)); return m; }
}
module.exports = { MLP };
