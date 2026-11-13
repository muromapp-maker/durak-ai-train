// Çox oyunçulu botlar: təsadüfi, qaydalı (müqayisə üçün), neyron (öyrənən).
'use strict';
const { S_, R_ } = require('./simn.js');
const { featN, afterN, NF } = require('./featn.js');

const randomBotN = { name: 'təsadüfi', pick(g, info, rnd) { return info.M[(rnd() * info.M.length) | 0]; } };

// qaydalı: ən kiçik koz-olmayanla gəl, ən ucuz kartla vur (dəstə çoxdursa böyük koz yerinə götür), kozsuz ötür,
// kiçik koz-olmayanı üstünə at, qalan hallarda pas
const ruleBotN = {
  name: 'qaydalı',
  pick(g, info) {
    const M = info.M, TS = g.TS, val = (c) => R_(c) + (S_(c) === TS ? 13 : 0), mid = R_(g.trumpCard) >= 0 ? 9 : 9;
    const one = (t) => M.filter((m) => m.t === t);
    const leads = one('lead').filter((m) => m.cs.length === 1);
    if (leads.length) return leads.sort((a, b) => val(a.cs[0]) - val(b.cs[0]))[0];
    const tr = one('tr').filter((m) => m.cs.length === 1 && S_(m.cs[0]) !== TS);
    if (tr.length) return tr[0];
    const cov = one('cov');
    if (cov.length) {
      const best = cov.sort((a, b) => val(a.c) - val(b.c))[0];
      if (S_(best.c) === TS && g.dk.length > 6 && R_(best.c) >= 10) return M.find((m) => m.t === 'take');
      return best;
    }
    const adds = one('add').filter((m) => S_(m.cs[0]) !== TS && (g.dk.length === 0 || R_(m.cs[0]) <= mid));
    if (adds.length) return adds.sort((a, b) => val(a.cs[0]) - val(b.cs[0]))[0];
    return M.find((m) => m.t === 'pass' || m.t === 'take') || M[0];
  },
};

// neyron: hər gedişdən sonrakı vəziyyəti öz gözü ilə qiymətləndir ("durak olmamaq" ehtimalı), ən yaxşısını seç
function nnBotN(net, eps) {
  const x = new Float32Array(NF);
  return {
    name: 'neyron', net,
    value(g, m, p) { return net.forward(featN(g, afterN(g, m, p), p, x)); },
    pick(g, info, rnd) {
      const p = info.p;
      if (info.M.length === 1) return info.M[0];
      if (eps && rnd() < eps) return info.M[(rnd() * info.M.length) | 0];
      let best = null, bv = -1;
      for (const m of info.M) { const v = this.value(g, m, p); if (v > bv) { bv = v; best = m; } }
      return best;
    },
  };
}

// axtarışlı neyron (PIMC): p-nin görmədiyi kartlar K dəfə təsadüfi paylanır; hər namizəd gediş hər paylamada oynanır,
// rəqiblər neyronla cavab verir — p-nin növbəti qərarına (ən çox DEPTH qərar) qədər; sonra vəziyyət neyronla qiymətləndirilir.
// goal 'first': kimsə artıq çıxıbsa nəticə dəqiq bəllidir (scoreFirst).
function searchBotN(net, o) {
  o = o || {}; const K = o.K || 6, DEPTH = o.depth || 8, FIRST = o.goal === 'first', greedy = nnBotN(net, 0), x = new Float32Array(NF);
  const term = (c, p) => FIRST ? (c.first ? c.scoreFirst(p) : null) : (c.over() ? c.score(p) : (!c.active(p) ? 1 : null));
  return {
    name: 'axtarışlı neyron', net,
    pick(g, info, rnd) {
      const p = info.p, M = info.M;
      if (M.length === 1) return M[0];
      const sum = new Float64Array(M.length);
      for (let k = 0; k < K; k++) {
        const d = g.clone().determinize(p, rnd);
        for (let i = 0; i < M.length; i++) {
          const c = d.clone(); c.cur = p; c.play(M[i]);
          let v = null;
          let mine = null;
          for (let s = 0; s < DEPTH; s++) {
            v = term(c, p); if (v !== null) break;
            const inf = c.legal(); if (!inf) { v = term(c, p); break; }
            if (inf.p === p) { mine = inf; break; }
            c.play(greedy.pick(c, inf, rnd));
          }
          if (v === null) v = term(c, p);
          // yarpaq: p-nin növbəsidirsə — onun ən yaxşı gedişindən sonrakı vəziyyətin dəyəri (şəbəkə belə öyrədilib)
          if (v === null && mine) { v = -1; for (const m of mine.M) { const y = net.forward(featN(c, afterN(c, m, p), p, x)); if (y > v) v = y; } }
          if (v === null) v = net.forward(featN(c, null, p, x));
          sum[i] += v;
        }
      }
      let bi = 0; for (let i = 1; i < M.length; i++) if (sum[i] > sum[bi]) bi = i;
      return M[bi];
    },
  };
}

module.exports = { randomBotN, ruleBotN, nnBotN, searchBotN };
